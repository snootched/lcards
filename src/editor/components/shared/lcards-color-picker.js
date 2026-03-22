/**
 * @fileoverview LCARdS Color Picker
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
 * - Supports configurable prefixes (--lcards-*, --lcars-*, --cblcars-*)
 * - Uses luminance calculation for preview text contrast
 * - Integrates with ha-selector for HA compatibility
 *
 * @example
 * <lcards-color-picker
 *   .hass=${this.hass}
 *   .value=${'var(--lcards-orange)'}
 *   .variablePrefixes=${['--lcards-', '--lcars-']}
 *   ?showPreview=${true}
 *   @value-changed=${this._handleColorChange}>
 * </lcards-color-picker>
 */

import { LitElement, html, css } from 'lit';
import { ColorUtils } from '../../../core/themes/ColorUtils.js';

export class LCARdSColorPicker extends LitElement {

    static get properties() {
        return {
            hass: { type: Object },
            value: { type: String },
            disabled: { type: Boolean },
            variablePrefixes: { type: Array },  // Array of CSS variable prefixes to scan
            showPreview: { type: Boolean },      // Show live preview with computed color
            allowMatchLight: { type: Boolean },  // Allow "Match Light Colour" option
            entityId: { type: String },          // Entity ID — used to resolve match-light in preview
            showBuilder: { type: Boolean },      // Show computed token builder UI
            _cssVariables: { type: Array, state: true },
            _computedColor: { type: String, state: true },
            _builderMode: { type: Boolean, state: true },  // Toggle between builder/text mode
            _selectedFunction: { type: String, state: true },
            _baseColor: { type: String, state: true },
            _baseColor2: { type: String, state: true },  // For mix() function
            _amount: { type: Number, state: true }
        };
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        this.value = '';
        this.disabled = false;
        this.variablePrefixes = ['--lcards-', '--lcars-', '--cblcars-'];
        this.showPreview = true;
        this.allowMatchLight = false;
        this.entityId = '';
        this.showBuilder = true;  // Enable builder by default
        this._cssVariables = [];
        this._computedColor = '';
        this._variablesCache = null; // Static cache shared across instances

        // Builder state
        this._builderMode = false;
        this._selectedFunction = 'lighten';
        this._baseColor = '';
        this._baseColor2 = '';
        this._amount = 20;
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

            ha-select {
                width: 100%;
                position: relative;
            }

            /* Override MWC select to prevent clipping */
            //ha-select::part(menu) {
            //    z-index: 1000;
            //}

            .color-swatch {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 3px;
                margin-right: 8px;
                vertical-align: middle;
                border: 1px solid var(--divider-color, #e0e0e0);
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .color-swatch.transparent {
                background: linear-gradient(45deg, #ccc 25%, transparent 25%),
                            linear-gradient(-45deg, #ccc 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #ccc 75%),
                            linear-gradient(-45deg, transparent 75%, #ccc 75%);
                background-size: 8px 8px;
                background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            }

            ha-dropdown-item {
                --mdc-list-item-graphic-margin: 8px;
            }

            .preview {
                margin-top: 8px;
                padding: 12px;
                border-radius: 22px;
                border: 1px solid var(--divider-color, #e0e0e0);
                display: flex;
                flex-direction: column;
                gap: 4px;
                transition: all 0.2s ease;
            }

            .preview-value {
                font-size: 13px;
                font-family: monospace;
            }

            .preview-computed {
                font-size: 13px;
                opacity: 0.7;
            }

            /* Builder UI Styles */
            .mode-toggle {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }

            .mode-toggle ha-button {
                flex: 1;
            }

            .mode-toggle ha-button[outlined] {
                border: 1px solid var(--primary-color);
                color: var(--primary-color);
            }

            .builder-panel {
                background: var(--card-background-color, #fff);
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .builder-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .builder-row label {
                font-size: 13px;
                font-weight: 500;
                color: var(--primary-text-color);
            }

            .builder-result {
                background: var(--secondary-background-color, #f5f5f5);
                padding: 12px;
                border-radius: 8px;
                border: 1px solid var(--divider-color, #e0e0e0);
            }

            .builder-result code {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: var(--primary-text-color);
                word-break: break-all;
            }

            .result-actions {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-top: 8px;
            }

            .result-actions ha-button {
                --ha-button-border-radius: var(--ha-card-border-radius, 12px);
            }

            .result-actions ha-button[outlined] {
                border: 1px solid var(--primary-color);
                color: var(--primary-color);
            }

            .copy-success {
                font-size: 12px;
                color: var(--success-color, #4caf50);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .preview-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 12px;
            }

            .preview-swatch {
                padding: 12px;
                border-radius: var(--ha-card-border-radius, 12px);
                border: 1px solid var(--divider-color, #e0e0e0);
                text-align: center;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .preview-swatch-label {
                font-size: 13px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.8;
            }

            .preview-swatch-value {
                font-size: 13px;
                font-family: monospace;
                opacity: 0.7;
            }

            .validation-error {
                color: var(--error-color, #f44336);
                font-size: 12px;
                padding: 8px;
                background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                border-radius: 4px;
                margin-top: 8px;
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

            // Try to parse value into builder if in builder mode
            if (this._builderMode && this.value) {
                this._tryParseValueToBuilder(this.value);
            }
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
     * @returns {string} Formatted label (e.g., 'lcards-orange')
     * @private
     */
    _formatVariableName(varName) {
        // Remove the leading dashes but keep the prefix
        let label = varName;

        // Remove leading dashes
        if (label.startsWith('--')) {
            label = label.substring(2);
        }

        return label;
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

        // Resolve match-light before any further processing
        const resolvedValue = this._resolveMatchLightForPreview(this.value);

        // Check if value is a computed token expression
        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
        const isComputedToken = validFunctions.some(fn => resolvedValue.startsWith(`${fn}(`));

        if (isComputedToken) {
            // Approximate the computed color for preview
            this._computedColor = this._approximateComputedColor(resolvedValue);
        } else if (resolvedValue.includes('var(')) {
            // For CSS variables, compute the actual color via DOM
            try {
                const temp = document.createElement('div');
                temp.style.color = resolvedValue;
                document.body.appendChild(temp);
                const computed = getComputedStyle(temp).color;
                document.body.removeChild(temp);
                this._computedColor = computed;
            } catch (err) {
                this._computedColor = '';
            }
        } else {
            // Plain color value
            this._computedColor = resolvedValue;
        }
    }

    /**
     * Resolve 'match-light' to an actual colour string using the hass entity state.
     * Only used for editor preview — the card runtime uses _resolveMatchLightColor().
     * @param {string} value - May equal 'match-light' or contain it
     * @returns {string} Resolved colour, or the original string if unavailable
     * @private
     */
    _resolveMatchLightForPreview(value) {
        if (!value || !value.includes('match-light')) return value;
        // @ts-ignore - TS2339: auto-suppressed
        const entity = this.hass?.states?.[this.entityId];
        if (!entity || entity.state !== 'on') return value;

        let color = null;
        if (entity.attributes.rgb_color) {
            const [r, g, b] = entity.attributes.rgb_color;
            color = `rgb(${r}, ${g}, ${b})`;
        } else if (entity.attributes.hs_color) {
            const [h, s] = entity.attributes.hs_color;
            const v = (entity.attributes.brightness ?? 255) / 255;
            color = ColorUtils.hsToRgb ? (() => {
                const [r, g, b] = ColorUtils.hsToRgb(h, s, (entity.attributes.brightness ?? 255));
                return `rgb(${r}, ${g}, ${b})`;
            })() : null;
        } else if (entity.attributes.color_temp) {
            color = '#ffd89b';
        }

        if (!color) return value;
        return value.replace(/match-light/g, color);
    }

    /**
     * Compute actual color from CSS variable or computed token
     * @param {string} colorValue - Color value (may be CSS variable or computed token)
     * @returns {string} Computed color
     * @private
     */
    _computeColor(colorValue) {
        if (!colorValue) return '';

        // Resolve match-light token for preview via hass entity
        colorValue = this._resolveMatchLightForPreview(colorValue);

        // Check if it's a computed token
        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
        const isComputedToken = validFunctions.some(fn => colorValue.startsWith(`${fn}(`));

        if (isComputedToken) {
            return this._approximateComputedColor(colorValue);
        }

        // For CSS variables, compute the actual color via DOM
        if (colorValue.includes('var(')) {
            try {
                const temp = document.createElement('div');
                temp.style.color = colorValue;
                document.body.appendChild(temp);
                const computed = getComputedStyle(temp).color;
                document.body.removeChild(temp);
                return computed;
            } catch (err) {
                return '';
            }
        }

        return colorValue;
    }

    /**
     * Calculate luminance for contrast determination
     * Based on WCAG relative luminance formula
     * @param {string} color - Color value (hex, rgb, rgba)
     * @returns {number} Luminance value (0-1)
     * @private
     */
    _calculateLuminance(color) {
        return ColorUtils.luminance(color);
    }

    /**
     * Parse color string to RGB array
     * @param {string} color - Color value
     * @returns {Array<number>|null} [r, g, b]
     * @private
     */
    _parseColor(color) {
        return ColorUtils.parseColor(color);
    }

    /**
     * Convert RGB string to hex
     * @param {string} rgb - RGB color string (e.g., 'rgb(255, 153, 0)')
     * @returns {string|null} Hex color (e.g., '#ff9900')
     * @private
     */
    _rgbToHex(rgb) {
        const rgbValues = ColorUtils.parseColor(rgb);
        if (!rgbValues) return null;
        return ColorUtils.rgbToHex(rgbValues[0], rgbValues[1], rgbValues[2]);
    }

    /**
     * Get text color based on background luminance
     * @param {string} bgColor - Background color
     * @returns {string} 'black' or 'white'
     * @private
     */
    _getContrastColor(bgColor) {
        return ColorUtils.contrastColor(bgColor);
    }

    render() {
        return html`
            <div class="color-picker">
                ${this.showBuilder ? this._renderModeToggle() : ''}

                ${this._builderMode ? this._renderBuilderUI() : this._renderTextUI()}

                ${this.showPreview ? this._renderPreview() : ''}
            </div>
        `;
    }

    /**
     * Render mode toggle buttons
     * @returns {TemplateResult}
     * @private
     */
    _renderModeToggle() {
        return html`
            <div class="mode-toggle">
                <ha-button
                    appearance=${!this._builderMode ? 'accent' : 'filled'}
                    .disabled=${this.disabled}
                    @click=${() => this._setMode(false)}>
                    Picker/Text
                </ha-button>
                <ha-button
                    appearance=${this._builderMode ? 'accent' : 'filled'}
                    .disabled=${this.disabled}
                    @click=${() => this._setMode(true)}>
                    Computed Builder
                </ha-button>
            </div>
        `;
    }

    /**
     * Render standard text input UI
     * @returns {TemplateResult}
     * @private
     */
    _renderTextUI() {
        return html`
            <div class="color-inputs">
                <!-- CSS Variable Dropdown with Color Swatches -->
                <div class="input-group">
                    <div class="input-label">CSS Variable / Preset</div>
                    <ha-select
                        .value=${this._getCurrentDropdownValue()}
                        .disabled=${this.disabled}
                        fixedMenuPosition
                        @selected=${this._handleDropdownChange}
                        @closed=${(e) => e.stopPropagation()}>
                        ${this._renderDropdownItems()}
                    </ha-select>
                </div>

                <!-- Custom Color Input -->
                <div class="input-group">
                    <div class="input-label">Custom Color</div>
                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .selector=${{ text: {} }}
                        .value=${this.value || ''}
                        .disabled=${this.disabled}
                        @value-changed=${this._handleTextChange}
                        placeholder="#ff9900, rgb(255,153,0), var(...), lighten(...)">
                    </ha-selector>
                </div>
            </div>
        `;
    }

    /**
     * Render computed token builder UI
     * @returns {TemplateResult}
     * @private
     */
    _renderBuilderUI() {
        const expression = this._buildExpression();
        const isValid = this._validateExpression(expression);

        return html`
            <div class="builder-panel">
                <!-- Function Selector -->
                <div class="builder-row">
                    <label>Function:</label>
                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'lighten', label: 'Lighten' },
                            { value: 'darken', label: 'Darken' },
                            { value: 'alpha', label: 'Transparency' },
                            { value: 'saturate', label: 'Saturate' },
                            { value: 'desaturate', label: 'Desaturate' },
                            { value: 'mix', label: 'Mix Colours' }
                        ]}}}
                        .value=${this._selectedFunction}
                        .disabled=${this.disabled}
                        @value-changed=${this._onFunctionChange}>
                    </ha-selector>
                </div>

                <!-- Base Color Picker -->
                <div class="builder-row">
                    <label>${this._selectedFunction === 'mix' ? 'Color 1:' : 'Base Color:'}</label>
                    <ha-select
                        .value=${this._baseColor}
                        .disabled=${this.disabled}
                        fixedMenuPosition
                        @selected=${this._onBaseColorChange}
                        @closed=${(e) => e.stopPropagation()}>
                        ${this._renderDropdownItems()}
                    </ha-select>
                </div>

                <!-- Second Color for Mix Function -->
                ${this._selectedFunction === 'mix' ? html`
                    <div class="builder-row">
                        <label>Color 2:</label>
                        <ha-select
                            .value=${this._baseColor2}
                            .disabled=${this.disabled}
                            fixedMenuPosition
                            @selected=${this._onBaseColor2Change}
                            @closed=${(e) => e.stopPropagation()}>
                            ${this._renderDropdownItems()}
                        </ha-select>
                    </div>
                ` : ''}

                <!-- Amount Slider -->
                <div class="builder-row">
                    <label>${this._getAmountLabel()}: ${this._amount}%</label>
                    <ha-selector
                        // @ts-ignore - TS2339: auto-suppressed
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 100, step: 5, mode: 'slider' }}}
                        .value=${this._amount}
                        .disabled=${this.disabled}
                        @value-changed=${this._onAmountChange}>
                    </ha-selector>
                </div>

                <!-- Generated Expression -->
                <div class="builder-result">
                    <code>${expression || 'Configure options above'}</code>
                    ${expression ? html`
                        <div class="result-actions">
                            <ha-button
                                ?outlined=${true}
                                .disabled=${this.disabled || !isValid}
                                @click=${this._applyExpression}>
                                Apply
                            </ha-button>
                            <ha-button
                                ?outlined=${true}
                                .disabled=${this.disabled || !expression}
                                @click=${this._copyExpression}>
                                Copy
                            </ha-button>
                            ${this._copySuccess ? html`
                                <span class="copy-success">
                                    <ha-icon icon="mdi:check"></ha-icon>
                                    Copied!
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                ${!isValid && expression ? html`
                    <div class="validation-error">
                        Invalid expression. Please check the function syntax.
                    </div>
                ` : ''}

                <!-- Before/After Preview -->
                ${this._renderPreviewComparison()}
            </div>
        `;
    }

    /**
     * Get dropdown options
     * @returns {Array} Select options
     * @private
     */
    /*
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
    */

    /**
     * Render dropdown items with color swatches
     * @returns {TemplateResult}
     * @private
     */
    _renderDropdownItems() {
        const items = [];

        // Default option
        items.push(html`
            <ha-dropdown-item .value=${''}>-- Select Variable --</ha-dropdown-item>
        `);

        // Transparent option with checkered pattern
        items.push(html`
            <ha-dropdown-item .value=${'transparent'}>
                <span class="color-swatch transparent"></span>
                Transparent
            </ha-dropdown-item>
        `);

        // Match Light option (if enabled)
        if (this.allowMatchLight) {
            items.push(html`
                <ha-dropdown-item .value=${'match-light'}>
                    💡 Match Light Colour
                </ha-dropdown-item>
            `);
        }

        // CSS variables with color swatches
        this._cssVariables.forEach(variable => {
            const computedColor = this._computeColor(variable.value);
            items.push(html`
                <ha-dropdown-item .value=${variable.value}>
                    <span
                        class="color-swatch"
                        style="background-color: ${computedColor};">
                    </span>
                    ${variable.label}
                </ha-dropdown-item>
            `);
        });

        // @ts-ignore - TS2739: auto-suppressed
        return items;
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
        const hexColor = this._rgbToHex(bgColor);

        return html`
            <div
                class="preview"
                style="background-color: ${bgColor}; color: ${textColor};">
                <div class="preview-value">${this.value}</div>
                ${this._computedColor && this._computedColor !== this.value ? html`
                    <div class="preview-computed">
                        ${hexColor ? html`Hex: ${hexColor} • ` : ''}
                        RGB: ${this._computedColor}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle dropdown change
     * @param {CustomEvent} ev - selected event from ha-select
     * @private
     */
    _handleDropdownChange(ev) {
        if (this.disabled) return;

        // ha-select fires 'selected' with detail.value (HA 2026.2+ ha-dropdown migration)
        // @ts-ignore - TS2339: auto-suppressed
        const newValue = ev.detail?.value ?? ev.target?.value;
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

    // ============================================================================
    // COMPUTED TOKEN BUILDER METHODS
    // ============================================================================

    /**
     * Set UI mode (text entry vs builder)
     * @param {boolean} builderMode - True for builder, false for text
     * @private
     */
    _setMode(builderMode) {
        this._builderMode = builderMode;

        if (builderMode && this.value) {
            // Try to parse existing value into builder
            this._tryParseValueToBuilder(this.value);
        }
    }

    /**
     * Try to parse a value into builder fields
     * @param {string} value - Color value to parse
     * @private
     */
    _tryParseValueToBuilder(value) {
        if (!value || typeof value !== 'string') return;

        // Try to parse computed token
        const parsed = this._parseComputedToken(value);
        if (parsed) {
            this._selectedFunction = parsed.function;
            this._baseColor = parsed.baseColor;
            this._baseColor2 = parsed.baseColor2 || '';
            this._amount = parsed.amount;
        } else if (value.includes('var(') || value.startsWith('#') || value.startsWith('rgb')) {
            // If it's a plain color, set it as base color
            this._baseColor = value;
        }
    }

    /**
     * Parse computed token expression into builder components
     * @param {string} expression - Expression to parse
     * @returns {Object|null} Parsed components or null
     * @private
     */
    _parseComputedToken(expression) {
        if (!expression) return null;

        // Match: functionName(arg1, arg2) or functionName(arg1, arg2, arg3)
        const match = expression.match(/^(\w+)\((.+)\)$/);
        if (!match) return null;

        const [, funcName, argsStr] = match;

        // Split arguments (handle nested parentheses for var())
        const args = this._splitArguments(argsStr);

        if (!args || args.length < 2) return null;

        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
        if (!validFunctions.includes(funcName)) return null;

        // Parse based on function type
        if (funcName === 'mix') {
            if (args.length !== 3) return null;
            return {
                function: funcName,
                baseColor: args[0].trim(),
                baseColor2: args[1].trim(),
                amount: Math.round(parseFloat(args[2]) * 100)
            };
        } else {
            if (args.length !== 2) return null;
            return {
                function: funcName,
                baseColor: args[0].trim(),
                amount: Math.round(parseFloat(args[1]) * 100)
            };
        }
    }

    /**
     * Split arguments handling nested parentheses
     * @param {string} argsStr - Arguments string
     * @returns {Array<string>} Array of arguments
     * @private
     */
    _splitArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;

        for (const char of argsStr) {
            if (char === '(') {
                depth++;
                current += char;
            } else if (char === ')') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                args.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current) {
            args.push(current.trim());
        }

        return args;
    }

    /**
     * Build expression from current builder state
     * @returns {string} Computed token expression
     * @private
     */
    _buildExpression() {
        if (!this._selectedFunction || !this._baseColor) {
            return '';
        }

        const amount = this._amount / 100; // Convert percentage to decimal

        if (this._selectedFunction === 'mix') {
            if (!this._baseColor2) return '';
            return `${this._selectedFunction}(${this._baseColor}, ${this._baseColor2}, ${amount})`;
        } else {
            return `${this._selectedFunction}(${this._baseColor}, ${amount})`;
        }
    }

    /**
     * Validate computed token expression
     * @param {string} expression - Expression to validate
     * @returns {boolean} True if valid
     * @private
     */
    _validateExpression(expression) {
        if (!expression) return false;

        const validFunctions = ['lighten', 'darken', 'alpha', 'saturate', 'desaturate', 'mix'];
        const regex = new RegExp(`^(${validFunctions.join('|')})\\(.+\\)$`);

        if (!regex.test(expression)) return false;

        // Try to parse
        const parsed = this._parseComputedToken(expression);
        return parsed !== null;
    }

    /**
     * Get context-appropriate label for amount slider
     * @returns {string} Label text
     * @private
     */
    _getAmountLabel() {
        switch (this._selectedFunction) {
            case 'lighten':
                return 'Lighten Amount';
            case 'darken':
                return 'Darken Amount';
            case 'alpha':
                return 'Opacity';
            case 'saturate':
                return 'Saturation Increase';
            case 'desaturate':
                return 'Saturation Decrease';
            case 'mix':
                return 'Mix Ratio';
            default:
                return 'Amount';
        }
    }

    /**
     * Handle function selection change
     * @param {CustomEvent} ev - value-changed event from ha-selector
     * @private
     */
    _onFunctionChange(ev) {
        ev.stopPropagation();
        const newValue = ev.detail.value;
        if (newValue && newValue !== this._selectedFunction) {
            this._selectedFunction = newValue;

            // Reset amount to sensible default for function
            if (this._selectedFunction === 'alpha') {
                this._amount = 50; // 50% opacity is common
            } else if (this._selectedFunction === 'mix') {
                this._amount = 50; // 50/50 mix
            } else {
                this._amount = 20; // 20% adjustment
            }

            this.requestUpdate();
        }
    }

    /**
     * Handle base color selection change
     * @param {CustomEvent} ev - selected event from ha-select
     * @private
     */
    _onBaseColorChange(ev) {
        ev.stopPropagation();
        // @ts-ignore - TS2339: auto-suppressed
        const newValue = ev.detail?.value ?? ev.target?.value;
        if (newValue !== undefined && newValue !== this._baseColor) {
            this._baseColor = newValue;
            this.requestUpdate();
        }
    }

    /**
     * Handle second base color selection change (for mix)
     * @param {CustomEvent} ev - selected event from ha-select
     * @private
     */
    _onBaseColor2Change(ev) {
        ev.stopPropagation();
        // @ts-ignore - TS2339: auto-suppressed
        const newValue = ev.detail?.value ?? ev.target?.value;
        if (newValue !== undefined && newValue !== this._baseColor2) {
            this._baseColor2 = newValue;
            this.requestUpdate();
        }
    }

    /**
     * Handle amount slider change
     * @param {CustomEvent} ev - value-changed event from ha-selector
     * @private
     */
    _onAmountChange(ev) {
        ev.stopPropagation();
        const newValue = ev.detail.value;
        if (newValue !== undefined && Number(newValue) !== this._amount) {
            this._amount = Number(newValue);
            this.requestUpdate();
        }
    }

    /**
     * Apply generated expression to value
     * @private
     */
    _applyExpression() {
        const expression = this._buildExpression();
        if (expression && this._validateExpression(expression)) {
            this._emitChange(expression);
        }
    }

    /**
     * Copy expression to clipboard
     * @private
     */
    async _copyExpression() {
        const expression = this._buildExpression();
        if (!expression) return;

        try {
            await navigator.clipboard.writeText(expression);
            this._copySuccess = true;
            this.requestUpdate();

            // Clear success message after 2 seconds
            setTimeout(() => {
                this._copySuccess = false;
                this.requestUpdate();
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    /**
     * Render before/after preview comparison
     * @returns {TemplateResult}
     * @private
     */
    _renderPreviewComparison() {
        if (!this._baseColor) return html``;

        const baseComputed = this._computeColor(this._baseColor);
        const expression = this._buildExpression();

        // For computed color, we need to resolve it
        // Since we can't actually run ThemeTokenResolver here, we'll show a placeholder
        const resultComputed = expression ? this._approximateComputedColor(expression) : '';

        if (!baseComputed) return html``;

        return html`
            <div class="preview-comparison">
                <div class="preview-swatch" style="background-color: ${baseComputed}; color: ${this._getContrastColor(baseComputed)};">
                    <div class="preview-swatch-label">Before</div>
                    <div class="preview-swatch-value">${this._rgbToHex(baseComputed) || baseComputed}</div>
                </div>
                ${resultComputed ? html`
                    <div class="preview-swatch" style="background-color: ${resultComputed}; color: ${this._getContrastColor(resultComputed)};">
                        <div class="preview-swatch-label">After (Preview)</div>
                        <div class="preview-swatch-value">${this._rgbToHex(resultComputed) || resultComputed}</div>
                    </div>
                ` : html`
                    <div class="preview-swatch" style="background-color: var(--disabled-color, #ccc); color: black;">
                        <div class="preview-swatch-label">After</div>
                        <div class="preview-swatch-value">Configure function</div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Approximate computed color result for preview
     * Uses ColorUtils for accurate color computation
     * @param {string} expression - Computed token expression
     * @returns {string} Approximated RGB color
     * @private
     */
    _approximateComputedColor(expression) {
        const parsed = this._parseComputedToken(expression);
        if (!parsed) return '';

        // Resolve base color (handle CSS variables)
        const baseColor = this._computeColor(parsed.baseColor);
        if (!baseColor) return '';

        const amount = parsed.amount / 100;

        try {
            switch (parsed.function) {
                case 'lighten':
                    return ColorUtils.lighten(baseColor, amount);
                case 'darken':
                    return ColorUtils.darken(baseColor, amount);
                case 'alpha':
                    return ColorUtils.alpha(baseColor, amount);
                case 'saturate':
                    return ColorUtils.saturate(baseColor, amount);
                case 'desaturate':
                    return ColorUtils.desaturate(baseColor, amount);
                case 'mix': {
                    if (!parsed.baseColor2) return '';
                    const color2 = this._computeColor(parsed.baseColor2);
                    if (!color2) return '';
                    return ColorUtils.mix(baseColor, color2, amount);
                }
                default:
                    return '';
            }
        } catch (error) {
            console.warn('[ColorPicker] Failed to compute color:', error);
            return '';
        }
    }
}

// Static cache for CSS variables (shared across instances)
LCARdSColorPicker._variablesCache = null;

customElements.define('lcards-color-picker', LCARdSColorPicker);
