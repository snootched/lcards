/**
 * @fileoverview LCARdS Border Editor
 *
 * Configure border width/color per side and radius per corner.
 * Supports unified mode (all sides/corners same) and per-side/corner mode.
 *
 * @example
 * <lcards-border-editor
 *   .editor=${this}
 *   path="style.border"
 *   label="Border Configuration"
 *   ?showPreview=${true}
 *   @value-changed=${this._handleBorderChange}>
 * </lcards-border-editor>
 */

import { LitElement, html, css, svg } from 'lit';
import '../shared/lcards-form-section.js';
import './lcards-color-section-v2.js';

export class LCARdSBorderEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            path: { type: String },           // Config path (e.g., 'style.border')
            label: { type: String },          // Label for the section
            showPreview: { type: Boolean },   // Show visual preview
            _widthMode: { type: String, state: true }, // 'unified' or 'per-side'
            _radiusMode: { type: String, state: true }, // 'unified' or 'per-corner'
            _borderConfig: { type: Object, state: true } // Current border configuration
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.editor = null;
        this.path = 'style.border';
        this.label = 'Border Configuration';
        this.showPreview = true;
        this._widthMode = 'unified';
        this._radiusMode = 'unified';
        this._borderConfig = {};
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .form-row {
                margin-bottom: 12px;
            }

            .form-row label {
                display: block;
                font-weight: 500;
                color: var(--primary-text-color);
                font-size: 14px;
                margin-bottom: 8px;
                padding: 2px 8px;
            }

            .form-row .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
                padding: 0 8px;
            }

            .preview-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 24px;
                background: var(--primary-background-color);
                border-radius: var(--ha-card-border-radius, 12px);
                margin-bottom: 12px;
            }

            .preview-container svg {
                max-width: 200px;
                height: auto;
            }

            ha-textfield {
                width: 100%;
                display: block;
            }

            .per-side-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            @media (max-width: 768px) {
                .per-side-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadBorderConfig();
    }

    /**
     * Load border configuration from editor
     * @private
     */
    _loadBorderConfig() {
        if (!this.editor) return;

        const borderValue = this.editor._getConfigValue(this.path);
        this._borderConfig = borderValue || {};

        // Determine width mode
        if (typeof this._borderConfig.width === 'object') {
            this._widthMode = 'per-side';
        } else {
            this._widthMode = 'unified';
        }

        // Determine radius mode
        if (typeof this._borderConfig.radius === 'object') {
            this._radiusMode = 'per-corner';
        } else {
            this._radiusMode = 'unified';
        }
    }

    render() {
        if (!this.editor) {
            return html`<div>Border editor requires 'editor' property</div>`;
        }

        return html`
            <lcards-form-section
                header="${this.label}"
                description="Configure border styling and dimensions"
                icon="mdi:border-all"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${this.showPreview ? this._renderPreview() : ''}

                ${this._renderWidthControls()}

                ${this._renderRadiusControls()}

                ${this._renderColorControls()}
            </lcards-form-section>
        `;
    }

    /**
     * Render visual SVG preview
     * @returns {TemplateResult}
     * @private
     */
    _renderPreview() {
        const width = this._getEffectiveWidth();
        const radius = this._getEffectiveRadius();
        const color = this._borderConfig.color?.default || '#03a9f4';
        const strokeWidth = Math.max(width.top, width.right, width.bottom, width.left);

        // Calculate the rectangle bounds
        const x = width.left;
        const y = width.top;
        const w = 200 - width.left - width.right;
        const h = 120 - width.top - width.bottom;

        // Build path with individual corner radii
        const tl = Math.min(radius.top_left || 0, w / 2, h / 2);
        const tr = Math.min(radius.top_right || 0, w / 2, h / 2);
        const br = Math.min(radius.bottom_right || 0, w / 2, h / 2);
        const bl = Math.min(radius.bottom_left || 0, w / 2, h / 2);

        const path = `
            M ${x + tl} ${y}
            L ${x + w - tr} ${y}
            ${tr > 0 ? `A ${tr} ${tr} 0 0 1 ${x + w} ${y + tr}` : ''}
            L ${x + w} ${y + h - br}
            ${br > 0 ? `A ${br} ${br} 0 0 1 ${x + w - br} ${y + h}` : ''}
            L ${x + bl} ${y + h}
            ${bl > 0 ? `A ${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` : ''}
            L ${x} ${y + tl}
            ${tl > 0 ? `A ${tl} ${tl} 0 0 1 ${x + tl} ${y}` : ''}
            Z
        `;

        return html`
            <div class="preview-container">
                <svg width="200" height="120" viewBox="0 0 200 120">
                    <path
                        d="${path}"
                        fill="none"
                        stroke="${color}"
                        stroke-width="${strokeWidth}" />
                </svg>
            </div>
        `;
    }

    /**
     * Render width controls
     * @returns {TemplateResult}
     * @private
     */
    _renderWidthControls() {
        const width = this._borderConfig.width || 2;
        const isUnified = this._widthMode === 'unified';

        return html`
            <lcards-form-section
                header="Border Width"
                description="Configure border thickness"
                icon="mdi:border-style"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <ha-selector
                    .hass=${this.editor?.hass}
                    .selector=${{ boolean: {} }}
                    .value=${!isUnified}
                    .label=${'Per-Side Width'}
                    @value-changed=${(e) => {
                        if (e.detail.value !== !isUnified) {
                            this._toggleWidthMode();
                        }
                    }}>
                </ha-selector>

                ${isUnified ? html`
                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .label=${'Width (px)'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 100,
                                step: 1,
                                mode: 'box',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof width === 'number' ? width : 2}
                        @value-changed=${(e) => this._updateBorderProperty('width', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <div class="per-side-grid">
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .label=${'Top (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${width?.top || 2}
                            @value-changed=${(e) => this._updateBorderProperty('width.top', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .label=${'Right (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${width?.right || 2}
                            @value-changed=${(e) => this._updateBorderProperty('width.right', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .label=${'Bottom (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${width?.bottom || 2}
                            @value-changed=${(e) => this._updateBorderProperty('width.bottom', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .label=${'Left (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${width?.left || 2}
                            @value-changed=${(e) => this._updateBorderProperty('width.left', e.detail.value)}>
                        </ha-selector>
                    </div>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Render color controls
     * @returns {TemplateResult}
     * @private
     */
    _renderColorControls() {
        return html`
            <lcards-color-section-v2
                .editor=${this.editor}
                basePath="${this.path}.color"
                header="Border Colours"
                .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                ?allowCustomStates=${true}
                ?expanded=${false}>
            </lcards-color-section-v2>
        `;
    }

    /**
     * Render radius controls
     * @returns {TemplateResult}
     * @private
     */
    _renderRadiusControls() {
        const radius = this._borderConfig.radius || 12;
        const isUnified = this._radiusMode === 'unified';

        return html`
            <lcards-form-section
                header="Border Radius"
                description="Configure corner rounding"
                icon="mdi:border-radius"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <ha-selector
                    .hass=${this.editor?.hass}
                    .selector=${{ boolean: {} }}
                    .value=${!isUnified}
                    .label=${'Per-Corner Radius'}
                    @value-changed=${(e) => {
                        if (e.detail.value !== !isUnified) {
                            this._toggleRadiusMode();
                        }
                    }}>
                </ha-selector>

                ${isUnified ? html`
                    <ha-selector
                        .hass=${this.editor?.hass}
                        .label=${'Radius (px)'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 100,
                                step: 1,
                                mode: 'box',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof radius === 'number' ? radius : 12}
                        @value-changed=${(e) => this._updateBorderProperty('radius', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <div class="per-side-grid">
                        <ha-selector
                            .hass=${this.editor?.hass}
                            .label=${'Top-Left (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${radius?.top_left || 12}
                            @value-changed=${(e) => this._updateBorderProperty('radius.top_left', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.editor?.hass}
                            .label=${'Top-Right (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${radius?.top_right || 12}
                            @value-changed=${(e) => this._updateBorderProperty('radius.top_right', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.editor?.hass}
                            .label=${'Bottom-Right (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${radius?.bottom_right || 12}
                            @value-changed=${(e) => this._updateBorderProperty('radius.bottom_right', e.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.editor?.hass}
                            .label=${'Bottom-Left (px)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    mode: 'box',
                                    unit_of_measurement: 'px'
                                }
                            }}
                            .value=${radius?.bottom_left || 12}
                            @value-changed=${(e) => this._updateBorderProperty('radius.bottom_left', e.detail.value)}>
                        </ha-selector>
                    </div>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Toggle width mode (unified/per-side)
     * @private
     */
    _toggleWidthMode() {
        const currentWidth = this._borderConfig.width || 2;

        if (this._widthMode === 'unified') {
            // Convert to per-side
            const value = typeof currentWidth === 'number' ? currentWidth : 2;
            this._widthMode = 'per-side';
            this._updateBorderProperty('width', {
                top: value,
                right: value,
                bottom: value,
                left: value
            });
        } else {
            // Convert to unified
            const avgWidth = typeof currentWidth === 'object'
                ? Math.round((currentWidth.top + currentWidth.right + currentWidth.bottom + currentWidth.left) / 4)
                : 2;
            this._widthMode = 'unified';
            this._updateBorderProperty('width', avgWidth);
        }
    }

    /**
     * Toggle radius mode (unified/per-corner)
     * @private
     */
    _toggleRadiusMode() {
        const currentRadius = this._borderConfig.radius || 12;

        if (this._radiusMode === 'unified') {
            // Convert to per-corner
            const value = typeof currentRadius === 'number' ? currentRadius : 12;
            this._radiusMode = 'per-corner';
            this._updateBorderProperty('radius', {
                top_left: value,
                top_right: value,
                bottom_right: value,
                bottom_left: value
            });
        } else {
            // Convert to unified
            const avgRadius = typeof currentRadius === 'object'
                ? Math.round((currentRadius.top_left + currentRadius.top_right + currentRadius.bottom_right + currentRadius.bottom_left) / 4)
                : 12;
            this._radiusMode = 'unified';
            this._updateBorderProperty('radius', avgRadius);
        }
    }

    /**
     * Update border property
     * @param {string} property - Property path (e.g., 'width.top')
     * @param {*} value - New value
     * @private
     */
    _updateBorderProperty(property, value) {
        const keys = property.split('.');
        const updatedConfig = { ...this._borderConfig };

        let current = updatedConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        this._borderConfig = updatedConfig;

        if (this.editor) {
            this.editor._setConfigValue(this.path, updatedConfig);
        }

        // Dispatch value-changed event
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: updatedConfig },
            bubbles: true,
            composed: true
        }));

        this.requestUpdate();
    }

    /**
     * Get effective width for all sides
     * @returns {Object} { top, right, bottom, left }
     * @private
     */
    _getEffectiveWidth() {
        const width = this._borderConfig.width || 2;
        if (typeof width === 'number') {
            return { top: width, right: width, bottom: width, left: width };
        }
        return {
            top: width.top || 2,
            right: width.right || 2,
            bottom: width.bottom || 2,
            left: width.left || 2
        };
    }

    /**
     * Get effective radius for all corners
     * @returns {Object} { topLeft, topRight, bottomRight, bottomLeft }
     * @private
     */
    _getEffectiveRadius() {
        const radius = this._borderConfig.radius || 12;
        if (typeof radius === 'number') {
            return { top_left: radius, top_right: radius, bottom_right: radius, bottom_left: radius };
        }
        return {
            top_left: radius.top_left || 12,
            top_right: radius.top_right || 12,
            bottom_right: radius.bottom_right || 12,
            bottom_left: radius.bottom_left || 12
        };
    }
}

customElements.define('lcards-border-editor', LCARdSBorderEditor);
