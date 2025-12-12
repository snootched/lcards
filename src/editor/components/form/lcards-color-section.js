/**
 * LCARdS Color Section
 *
 * Specialized section component for organizing state-based color configurations.
 * Intelligently handles both simple string colors and state-based object colors
 * using oneOf schema patterns.
 *
 * @example
 * <lcards-color-section
 *   .editor=${this}
 *   basePath="style.color"
 *   header="Button Colors"
 *   .states=${['default', 'active', 'hover', 'disabled']}>
 * </lcards-color-section>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-form-field.js';
import './lcards-color-picker.js';
import { getSchemaAtPath } from '../../../utils/schema-helpers.js';

export class LCARdSColorSection extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            basePath: { type: String },       // Base config path (e.g., 'style.color')
            header: { type: String },         // Section header
            description: { type: String },    // Section description
            states: { type: Array },          // Array of state names (e.g., ['default', 'active'])
            expanded: { type: Boolean },      // Expanded state
            variablePrefixes: { type: Array }, // CSS variable prefixes to scan
            showPreview: { type: Boolean },    // Show color preview
            useColorPicker: { type: Boolean }  // Use enhanced color picker vs basic form-field
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.basePath = '';
        this.header = 'Colors';
        this.description = '';
        this.states = ['default', 'active', 'hover', 'disabled'];
        this.expanded = false;
        this.variablePrefixes = ['--lcards-', '--picard-', '--lcars-', '--cblcars-'];
        this.showPreview = true;
        this.useColorPicker = true; // Default to enhanced picker
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .mode-toggle {
                margin-bottom: 12px;
            }

            .mode-info {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 8px;
                font-style: italic;
            }
        `;
    }

    /**
     * Get the current value at basePath
     * @returns {*}
     * @private
     */
    _getCurrentValue() {
        if (!this.editor?.config) return undefined;

        const keys = this.basePath.split('.');
        let value = this.editor.config;

        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }

        return value;
    }

    /**
     * Check if schema at basePath is a oneOf
     * @returns {boolean}
     * @private
     */
    _isOneOfSchema() {
        if (!this.editor?.schema) return false;

        const schema = getSchemaAtPath(this.editor.schema, this.basePath);
        return schema && Array.isArray(schema.oneOf);
    }

    /**
     * Determine current mode based on value type
     * @returns {'simple'|'states'}
     * @private
     */
    _getCurrentMode() {
        const value = this._getCurrentValue();

        // If value is undefined or null, default to 'simple'
        if (value === undefined || value === null) return 'simple';

        // If value is a string, it's simple mode
        if (typeof value === 'string') return 'simple';

        // If value is an object, it's states mode
        if (typeof value === 'object') return 'states';

        // Default to simple
        return 'simple';
    }

    /**
     * Toggle between simple and states mode
     * @private
     */
    _toggleMode() {
        const currentMode = this._getCurrentMode();
        const currentValue = this._getCurrentValue();

        let newValue;
        if (currentMode === 'simple') {
            // Convert to states mode: create object with default state
            newValue = {
                default: typeof currentValue === 'string' ? currentValue : '#ffffff'
            };
        } else {
            // Convert to simple mode: use default state or first available
            if (typeof currentValue === 'object' && currentValue !== null) {
                newValue = currentValue.default || currentValue[Object.keys(currentValue)[0]] || '#ffffff';
            } else {
                newValue = '#ffffff';
            }
        }

        this.editor.updateConfig(this.basePath, newValue);
    }

    render() {
        if (!this.editor || !this.basePath) {
            return html`
                <ha-alert alert-type="error">
                    Color section requires 'editor' and 'basePath' properties
                </ha-alert>
            `;
        }

        const isOneOf = this._isOneOfSchema();
        const currentMode = this._getCurrentMode();

        return html`
            <lcards-form-section
                header="${this.header}"
                description="${this.description}"
                ?expanded=${this.expanded}
                outlined>

                ${isOneOf ? this._renderModeToggle(currentMode) : ''}

                ${currentMode === 'simple'
                    ? this._renderSimpleColor()
                    : this._renderStateColors()}
            </lcards-form-section>
        `;
    }

    /**
     * Render mode toggle button (for oneOf schemas)
     * @param {string} currentMode
     * @returns {TemplateResult}
     * @private
     */
    _renderModeToggle(currentMode) {
        return html`
            <div class="mode-toggle">
                <ha-button
                    @click=${this._toggleMode}
                    outlined>
                    ${currentMode === 'simple'
                        ? '🔄 Use State-Based Colors'
                        : '🔄 Use Single Color'}
                </ha-button>
                <div class="mode-info">
                    ${currentMode === 'simple'
                        ? 'Currently using a single color for all states'
                        : 'Currently using different colors per state'}
                </div>
            </div>
        `;
    }

    /**
     * Render simple single color picker
     * @returns {TemplateResult}
     * @private
     */
    _renderSimpleColor() {
        if (this.useColorPicker) {
            const value = this.editor._getConfigValue(this.basePath);
            return html`
                <lcards-color-picker
                    .hass=${this.editor.hass}
                    .value=${value || ''}
                    .variablePrefixes=${this.variablePrefixes}
                    ?showPreview=${this.showPreview}
                    @value-changed=${(e) => this._handleColorChange(this.basePath, e)}>
                </lcards-color-picker>
            `;
        }

        return html`
            <lcards-form-field
                .editor=${this.editor}
                path="${this.basePath}"
                label="Color">
            </lcards-form-field>
        `;
    }

    /**
     * Render state-based color pickers
     * @returns {TemplateResult}
     * @private
     */
    _renderStateColors() {
        return html`
            ${this.states.map(state => this._renderColorField(state))}
        `;
    }

    /**
     * Render a color field for a specific state
     * @param {string} state - State name (e.g., 'default', 'active')
     * @returns {TemplateResult}
     * @private
     */
    _renderColorField(state) {
        const path = `${this.basePath}.${state}`;
        const label = this._formatStateLabel(state);

        if (this.useColorPicker) {
            const value = this.editor._getConfigValue(path);
            return html`
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">
                        ${label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.editor.hass}
                        .value=${value || ''}
                        .variablePrefixes=${this.variablePrefixes}
                        ?showPreview=${this.showPreview}
                        @value-changed=${(e) => this._handleColorChange(path, e)}>
                    </lcards-color-picker>
                </div>
            `;
        }

        return html`
            <lcards-form-field
                .editor=${this.editor}
                path="${path}"
                label="${label}">
            </lcards-form-field>
        `;
    }

    /**
     * Handle color change from color picker
     * @param {string} path - Config path
     * @param {CustomEvent} event - value-changed event
     * @private
     */
    _handleColorChange(path, event) {
        const newValue = event.detail.value;
        this.editor._setConfigValue(path, newValue);
    }

    /**
     * Format state name as readable label
     * @param {string} state - State name
     * @returns {string} Formatted label
     * @private
     */
    _formatStateLabel(state) {
        return state
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

customElements.define('lcards-color-section', LCARdSColorSection);
