/**
 * LCARdS Border Editor
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
import './lcards-form-section.js';
import './lcards-color-section.js';

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

            .mode-toggle {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px;
                background: var(--secondary-background-color, #f5f5f5);
                border-radius: 8px;
                margin-bottom: 12px;
            }

            .mode-toggle label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                margin: 0;
            }

            .mode-toggle mwc-icon-button {
                --mdc-icon-size: 20px;
            }

            .form-row {
                margin-bottom: 16px;
            }

            .form-row label {
                display: block;
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                margin-bottom: 8px;
                padding: 2px 8px;
            }

            .form-row .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                margin-top: 4px;
                padding: 0 8px;
            }

            .preview-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 24px;
                background: var(--card-background-color, #fff);
                border-radius: 8px;
                margin-bottom: 16px;
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
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${this.showPreview ? this._renderPreview() : ''}
                
                ${this._renderWidthControls()}
                
                ${this._renderColorControls()}
                
                ${this._renderRadiusControls()}
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

        return html`
            <div class="preview-container">
                <svg width="200" height="120" viewBox="0 0 200 120">
                    <rect
                        x="${width.left}"
                        y="${width.top}"
                        width="${200 - width.left - width.right}"
                        height="${120 - width.top - width.bottom}"
                        rx="${radius.topLeft}"
                        ry="${radius.topLeft}"
                        fill="none"
                        stroke="${color}"
                        stroke-width="${Math.max(width.top, width.right, width.bottom, width.left)}" />
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
            <div class="mode-toggle">
                <mwc-icon-button
                    icon="${isUnified ? 'mdi:lock' : 'mdi:lock-open'}"
                    title="${isUnified ? 'Switch to per-side' : 'Switch to unified'}"
                    @click=${() => this._toggleWidthMode()}>
                </mwc-icon-button>
                <label>${isUnified ? 'Unified Width' : 'Per-Side Width'}</label>
            </div>

            ${isUnified ? html`
                <div class="form-row">
                    <label>Width (px)</label>
                    <ha-textfield
                        type="number"
                        .value=${typeof width === 'number' ? width : 2}
                        min="0"
                        @input=${(e) => this._updateBorderProperty('width', Number(e.target.value))}>
                    </ha-textfield>
                </div>
            ` : html`
                <div class="per-side-grid">
                    <div class="form-row">
                        <label>Top (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${width?.top || 2}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('width.top', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Right (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${width?.right || 2}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('width.right', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Bottom (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${width?.bottom || 2}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('width.bottom', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Left (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${width?.left || 2}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('width.left', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                </div>
            `}
        `;
    }

    /**
     * Render color controls
     * @returns {TemplateResult}
     * @private
     */
    _renderColorControls() {
        return html`
            <lcards-color-section
                .editor=${this.editor}
                basePath="${this.path}.color"
                header="Border Colors"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>
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
            <div class="mode-toggle">
                <mwc-icon-button
                    icon="${isUnified ? 'mdi:lock' : 'mdi:lock-open'}"
                    title="${isUnified ? 'Switch to per-corner' : 'Switch to unified'}"
                    @click=${() => this._toggleRadiusMode()}>
                </mwc-icon-button>
                <label>${isUnified ? 'Unified Radius' : 'Per-Corner Radius'}</label>
            </div>

            ${isUnified ? html`
                <div class="form-row">
                    <label>Radius (px)</label>
                    <ha-textfield
                        type="number"
                        .value=${typeof radius === 'number' ? radius : 12}
                        min="0"
                        @input=${(e) => this._updateBorderProperty('radius', Number(e.target.value))}>
                    </ha-textfield>
                </div>
            ` : html`
                <div class="per-side-grid">
                    <div class="form-row">
                        <label>Top-Left (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${radius?.topLeft || 12}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('radius.topLeft', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Top-Right (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${radius?.topRight || 12}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('radius.topRight', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Bottom-Right (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${radius?.bottomRight || 12}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('radius.bottomRight', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                    <div class="form-row">
                        <label>Bottom-Left (px)</label>
                        <ha-textfield
                            type="number"
                            .value=${radius?.bottomLeft || 12}
                            min="0"
                            @input=${(e) => this._updateBorderProperty('radius.bottomLeft', Number(e.target.value))}>
                        </ha-textfield>
                    </div>
                </div>
            `}
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
                topLeft: value,
                topRight: value,
                bottomRight: value,
                bottomLeft: value
            });
        } else {
            // Convert to unified
            const avgRadius = typeof currentRadius === 'object'
                ? Math.round((currentRadius.topLeft + currentRadius.topRight + currentRadius.bottomRight + currentRadius.bottomLeft) / 4)
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
            return { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius };
        }
        return {
            topLeft: radius.topLeft || 12,
            topRight: radius.topRight || 12,
            bottomRight: radius.bottomRight || 12,
            bottomLeft: radius.bottomLeft || 12
        };
    }
}

customElements.define('lcards-border-editor', LCARdSBorderEditor);
