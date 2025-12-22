/**
 * LCARdS Font Selector Component
 * 
 * Specialized selector for font-family properties with:
 * - Categorized dropdown (Core, Standard, Alien)
 * - Custom external font support
 * - Auto-loading of selected fonts
 * - Preview text (optional)
 * - Automatic migration of legacy CB-LCARS names
 * 
 * @example
 * <lcards-font-selector
 *   .hass=${this.hass}
 *   .value=${'lcards_borg'}
 *   .showPreview=${true}
 *   @value-changed=${this._handleFontChange}>
 * </lcards-font-selector>
 */

import { LitElement, html, css } from 'lit';
import { getFontSelectorOptions, ensureFontLoaded, isKnownFont, migrateFontName } from '../../../utils/lcards-fonts.js';

export class LCARdSFontSelector extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            disabled: { type: Boolean },
            showPreview: { type: Boolean },
            label: { type: String },
            helper: { type: String },
            _isCustomMode: { type: Boolean, state: true },
            _displayValue: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.value = '';
        this.disabled = false;
        this.showPreview = false;
        this.label = 'Font Family';
        this.helper = '';
        this._isCustomMode = false;
        this._displayValue = '';
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .font-selector {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .selector-row {
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            .selector-main {
                flex: 1;
            }

            .toggle-button {
                padding: 8px 12px;
                background: var(--secondary-background-color, #fafafa);
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                white-space: nowrap;
            }

            .toggle-button:hover {
                background: var(--primary-color, #03a9f4);
                color: white;
            }

            .preview {
                margin-top: 8px;
                padding: 12px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                font-size: 16px;
                text-align: center;
            }

            .input-label {
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
                margin-bottom: 4px;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
            }

            .migration-notice {
                font-size: 11px;
                color: var(--warning-color, #ff9800);
                padding: 4px 8px;
                font-style: italic;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Migrate legacy font name if needed
        const migratedValue = migrateFontName(this.value);
        if (migratedValue !== this.value) {
            this._displayValue = migratedValue;
            // Emit migrated value
            setTimeout(() => {
                this.value = migratedValue;
                this._emitChange();
            }, 0);
        } else {
            this._displayValue = this.value;
        }
        
        // Check if current value is custom (not in registry)
        if (this._displayValue && !isKnownFont(this._displayValue) && this._displayValue !== '__custom__') {
            this._isCustomMode = true;
        }
    }

    render() {
        const showMigrationNotice = this.value && this.value !== this._displayValue;
        
        return html`
            <div class="font-selector">
                ${this.label ? html`<div class="input-label">${this.label}</div>` : ''}
                
                <div class="selector-row">
                    <div class="selector-main">
                        ${this._isCustomMode ? this._renderCustomInput() : this._renderDropdown()}
                    </div>
                    <button 
                        class="toggle-button"
                        @click=${this._toggleMode}
                        ?disabled=${this.disabled}>
                        ${this._isCustomMode ? '📋 Use Preset' : '🔧 Custom'}
                    </button>
                </div>

                ${showMigrationNotice ? html`
                    <div class="migration-notice">
                        ⚠️ Migrated from legacy name: ${this.value}
                    </div>
                ` : ''}

                ${this.helper ? html`<div class="helper-text">${this.helper}</div>` : ''}
                ${this.showPreview ? this._renderPreview() : ''}
            </div>
        `;
    }

    /**
     * Render dropdown with categorized fonts
     * @private
     */
    _renderDropdown() {
        const options = getFontSelectorOptions(false); // Don't include custom option (we have button)

        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{
                    select: {
                        mode: 'dropdown',
                        options: options
                    }
                }}
                .value=${this._displayValue || 'Antonio'}
                .disabled=${this.disabled}
                @value-changed=${this._handleDropdownChange}>
            </ha-selector>
        `;
    }

    /**
     * Render custom font text input
     * @private
     */
    _renderCustomInput() {
        return html`
            <ha-selector
                .hass=${this.hass}
                .selector=${{ text: {} }}
                .value=${this._displayValue || ''}
                .disabled=${this.disabled}
                @value-changed=${this._handleTextChange}>
            </ha-selector>
        `;
    }

    /**
     * Render font preview
     * @private
     */
    _renderPreview() {
        const fontFamily = this._displayValue || 'Antonio';
        
        // Ensure font is loaded for preview
        if (fontFamily) {
            ensureFontLoaded(fontFamily);
        }

        return html`
            <div class="preview" style="font-family: ${fontFamily}">
                LCARS 47 — The quick brown fox jumps over the lazy dog
            </div>
        `;
    }

    /**
     * Handle dropdown selection change
     * @param {CustomEvent} ev
     * @private
     */
    _handleDropdownChange(ev) {
        const newValue = ev.detail.value;
        this.value = newValue;
        this._displayValue = newValue;
        
        // Load font if needed
        ensureFontLoaded(newValue);
        
        this._emitChange();
    }

    /**
     * Handle custom text input change
     * @param {CustomEvent} ev
     * @private
     */
    _handleTextChange(ev) {
        this.value = ev.detail.value;
        this._displayValue = ev.detail.value;
        this._emitChange();
    }

    /**
     * Toggle between dropdown and custom input
     * @private
     */
    _toggleMode() {
        this._isCustomMode = !this._isCustomMode;
        
        // Reset value if switching from custom to dropdown
        if (!this._isCustomMode && !isKnownFont(this._displayValue)) {
            this.value = 'Antonio';
            this._displayValue = 'Antonio';
            this._emitChange();
        }
    }

    /**
     * Emit value-changed event
     * @private
     */
    _emitChange() {
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-font-selector', LCARdSFontSelector);
