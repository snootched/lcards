/**
 * LCARdS Color Picker
 *
 * Unified color picker component combining:
 * - CSS variable dropdown (dynamically scanned from document)
 * - Custom color text input for manual entry
 * - Live preview with computed value and luminance-based text contrast
 * - Special options: "transparent" and "Match Light Colour"
 *
 * Features:
 * - Scans document.documentElement.style for CSS variables
 * - Caches results for performance
 * - Supports configurable prefixes (--lcards-*, --picard-*, --lcars-*, --cblcars-*)
 * - Uses luminance calculation for preview text contrast
 * - Integrates with ha-selector for HA compatibility
 *
 * @example
 * <lcards-color-picker
 *   .hass=${this.hass}
 *   .value=${'var(--lcards-orange)'}
 *   .variablePrefixes=${['--lcards-', '--picard-']}
 *   ?showPreview=${true}
 *   @value-changed=${this._handleColorChange}>
 * </lcards-color-picker>
 */

import { LitElement, html, css } from 'lit';

export class LCARdSColorPicker extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            disabled: { type: Boolean },
            variablePrefixes: { type: Array },  // Array of CSS variable prefixes to scan
            showPreview: { type: Boolean },      // Show live preview with computed color
            allowMatchLight: { type: Boolean },  // Allow "Match Light Colour" option
            _cssVariables: { type: Array, state: true },
            _computedColor: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.value = '';
        this.disabled = false;
        this.variablePrefixes = ['--lcards-', '--picard-', '--lcars-', '--cblcars-'];
        this.showPreview = true;
        this.allowMatchLight = false;
        this._cssVariables = [];
        this._computedColor = '';
        this._variablesCache = null; // Static cache shared across instances
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .color-picker {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .color-inputs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            @media (max-width: 600px) {
                .color-inputs {
                    grid-template-columns: 1fr;
                }
            }

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .input-label {
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
            }

            ha-selector {
                width: 100%;
            }

            .preview {
                margin-top: 8px;
                padding: 12px;
                border-radius: 4px;
                border: 1px solid var(--divider-color, #e0e0e0);
                display: flex;
                flex-direction: column;
                gap: 4px;
                transition: all 0.2s ease;
            }

            .preview-label {
                font-size: 11px;
                font-weight: 500;
                opacity: 0.8;
            }

            .preview-value {
                font-size: 12px;
                font-family: monospace;
            }

            .preview-computed {
                font-size: 10px;
                opacity: 0.7;
                font-style: italic;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadCssVariables();
        this._updateComputedColor();
    }

    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('value')) {
            this._updateComputedColor();
        }
    }

    /**
     * Load CSS variables from document
     * Uses cache to avoid repeated scans
     * @private
     */
    _loadCssVariables() {
        // Use static cache if available
        if (LCARdSColorPicker._variablesCache) {
            this._cssVariables = LCARdSColorPicker._variablesCache;
            return;
        }

        const variables = [];
        const styles = getComputedStyle(document.documentElement);
        
        // Scan all CSS properties
        for (let i = 0; i < styles.length; i++) {
            const prop = styles[i];
            
            // Check if property matches any prefix
            const matchesPrefix = this.variablePrefixes.some(prefix => 
                prop.startsWith(prefix)
            );
            
            if (matchesPrefix) {
                const value = styles.getPropertyValue(prop).trim();
                if (value) {
                    variables.push({
                        name: prop,
                        value: `var(${prop})`,
                        label: this._formatVariableName(prop)
                    });
                }
            }
        }

        // Sort alphabetically by label
        variables.sort((a, b) => a.label.localeCompare(b.label));

        // Cache for future instances
        LCARdSColorPicker._variablesCache = variables;
        this._cssVariables = variables;
    }

    /**
     * Format CSS variable name for display
     * @param {string} varName - CSS variable name (e.g., '--lcards-orange')
     * @returns {string} Formatted label (e.g., 'Orange')
     * @private
     */
    _formatVariableName(varName) {
        // Remove prefix and dashes, convert to title case
        let label = varName;
        
        // Remove common prefixes
        for (const prefix of this.variablePrefixes) {
            if (label.startsWith(prefix)) {
                label = label.substring(prefix.length);
                break;
            }
        }
        
        // Convert kebab-case to Title Case
        return label
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Update computed color for preview
     * @private
     */
    _updateComputedColor() {
        if (!this.value) {
            this._computedColor = '';
            return;
        }

        // For CSS variables, compute the actual color
        if (this.value.includes('var(')) {
            try {
                // Create temporary element to compute color
                const temp = document.createElement('div');
                temp.style.color = this.value;
                document.body.appendChild(temp);
                const computed = getComputedStyle(temp).color;
                document.body.removeChild(temp);
                this._computedColor = computed;
            } catch (err) {
                this._computedColor = '';
            }
        } else {
            this._computedColor = this.value;
        }
    }

    /**
     * Calculate luminance for contrast determination
     * Based on WCAG relative luminance formula
     * @param {string} color - Color value (hex, rgb, rgba)
     * @returns {number} Luminance value (0-1)
     * @private
     */
    _calculateLuminance(color) {
        if (!color) return 0.5;

        // Parse RGB values
        const rgb = this._parseColor(color);
        if (!rgb) return 0.5;

        // Convert to relative luminance
        const [r, g, b] = rgb.map(val => {
            val = val / 255;
            return val <= 0.03928 
                ? val / 12.92 
                : Math.pow((val + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Parse color string to RGB array
     * @param {string} color - Color value
     * @returns {Array<number>|null} [r, g, b]
     * @private
     */
    _parseColor(color) {
        if (!color) return null;

        // Hex format
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                return [
                    parseInt(hex[0] + hex[0], 16),
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16)
                ];
            }
            if (hex.length === 6) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16)
                ];
            }
        }

        // RGB/RGBA format
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return [
                parseInt(rgbMatch[1]),
                parseInt(rgbMatch[2]),
                parseInt(rgbMatch[3])
            ];
        }

        return null;
    }

    /**
     * Get text color based on background luminance
     * @param {string} bgColor - Background color
     * @returns {string} 'black' or 'white'
     * @private
     */
    _getContrastColor(bgColor) {
        const luminance = this._calculateLuminance(bgColor);
        return luminance > 0.5 ? 'black' : 'white';
    }

    render() {
        return html`
            <div class="color-picker">
                <div class="color-inputs">
                    <!-- CSS Variable Dropdown -->
                    <div class="input-group">
                        <div class="input-label">CSS Variable / Preset</div>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{
                                select: {
                                    options: this._getDropdownOptions(),
                                    mode: 'dropdown'
                                }
                            }}
                            .value=${this._getCurrentDropdownValue()}
                            .disabled=${this.disabled}
                            @value-changed=${this._handleDropdownChange}>
                        </ha-selector>
                    </div>

                    <!-- Custom Color Input -->
                    <div class="input-group">
                        <div class="input-label">Custom Color</div>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ text: {} }}
                            .value=${this.value || ''}
                            .disabled=${this.disabled}
                            @value-changed=${this._handleTextChange}
                            placeholder="#ff9900, rgb(255,153,0), var(...)">
                        </ha-selector>
                    </div>
                </div>

                ${this.showPreview ? this._renderPreview() : ''}
            </div>
        `;
    }

    /**
     * Get dropdown options
     * @returns {Array} Select options
     * @private
     */
    _getDropdownOptions() {
        const options = [
            { value: '', label: '-- Select Variable --' },
            { value: 'transparent', label: '🔲 Transparent' }
        ];

        if (this.allowMatchLight) {
            options.push({ 
                value: 'match-light', 
                label: '💡 Match Light Colour' 
            });
        }

        // Add CSS variables
        this._cssVariables.forEach(variable => {
            options.push({
                value: variable.value,
                label: variable.label
            });
        });

        return options;
    }

    /**
     * Get current dropdown value
     * @returns {string}
     * @private
     */
    _getCurrentDropdownValue() {
        if (!this.value) return '';
        
        // Check for special values
        if (this.value === 'transparent') return 'transparent';
        if (this.value === 'match-light') return 'match-light';
        
        // Check if value matches a CSS variable
        const matchingVar = this._cssVariables.find(v => v.value === this.value);
        if (matchingVar) return matchingVar.value;
        
        return '';
    }

    /**
     * Render preview
     * @returns {TemplateResult}
     * @private
     */
    _renderPreview() {
        if (!this.value) return html``;

        const bgColor = this._computedColor || this.value;
        const textColor = this._getContrastColor(bgColor);

        return html`
            <div 
                class="preview" 
                style="background-color: ${bgColor}; color: ${textColor};">
                <div class="preview-label">Preview</div>
                <div class="preview-value">${this.value}</div>
                ${this._computedColor && this._computedColor !== this.value ? html`
                    <div class="preview-computed">Computed: ${this._computedColor}</div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle dropdown change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleDropdownChange(ev) {
        if (this.disabled) return;
        
        const newValue = ev.detail.value;
        if (newValue) {
            this._emitChange(newValue);
        }
    }

    /**
     * Handle text input change
     * @param {CustomEvent} ev - value-changed event
     * @private
     */
    _handleTextChange(ev) {
        if (this.disabled) return;
        
        const newValue = ev.detail.value;
        this._emitChange(newValue);
    }

    /**
     * Emit value-changed event
     * @param {string} value - New color value
     * @private
     */
    _emitChange(value) {
        this.value = value;
        this._updateComputedColor();
        
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }
}

// Static cache for CSS variables (shared across instances)
LCARdSColorPicker._variablesCache = null;

customElements.define('lcards-color-picker', LCARdSColorPicker);
