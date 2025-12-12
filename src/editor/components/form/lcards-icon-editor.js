/**
 * LCARdS Icon Editor (Simplified)
 *
 * Manages icon configuration with separate icon (string) and icon_style (object) properties.
 * - show_icon: top-level boolean
 * - icon: top-level string (mdi:lightbulb, entity, etc.)
 * - icon_style: object with position, size, color, background, padding, rotation
 *
 * @example
 * <lcards-icon-editor
 *   .editor=${this}
 *   .hass=${this.hass}>
 * </lcards-icon-editor>
 */

import { LitElement, html, css } from 'lit';
import './lcards-form-section.js';
import './lcards-form-field.js';
import './lcards-color-section.js';

export class LCARdSIconEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            hass: { type: Object },           // Home Assistant instance
            _showAdvanced: { type: Boolean, state: true } // Show advanced styling options
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.hass = null;
        this._showAdvanced = false;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .toggle-button {
                margin: 16px 0;
                padding: 8px 16px;
                background: var(--primary-color, #03a9f4);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .toggle-button:hover {
                opacity: 0.9;
            }
        `;
    }

    render() {
        if (!this.editor) {
            return html`<div>Icon editor requires 'editor' property</div>`;
        }

        return html`
            <lcards-form-section
                header="Icon Configuration"
                description="Configure icon and styling"
                icon="mdi:alpha-i-circle-outline"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Show Icon Toggle -->
                <lcards-form-field
                    .editor=${this.editor}
                    path="show_icon"
                    label="Show Icon">
                </lcards-form-field>

                <!-- Icon Picker -->
                <lcards-form-field
                    .editor=${this.editor}
                    path="icon"
                    label="Icon">
                </lcards-form-field>

                <!-- Icon Area -->
                <lcards-form-field
                    .editor=${this.editor}
                    path="icon_area"
                    label="Icon Area">
                </lcards-form-field>

                <!-- Toggle Advanced Styling -->
                <button
                    class="toggle-button"
                    @click=${() => this._showAdvanced = !this._showAdvanced}>
                    ${this._showAdvanced ? 'Hide' : 'Show'} Advanced Styling
                </button>

                ${this._showAdvanced ? this._renderAdvancedStyling() : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Render advanced styling options
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedStyling() {
        return html`
            <lcards-form-section
                header="Icon Styling"
                description="Advanced icon appearance options"
                ?expanded=${true}
                ?noCollapse=${true}
                headerLevel="5">

                <lcards-form-field
                    .editor=${this.editor}
                    path="icon_style.size"
                    label="Size (px)">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    path="icon_style.position"
                    label="Position">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this.editor}
                    path="icon_style.rotation"
                    label="Rotation (degrees)">
                </lcards-form-field>

                <!-- Icon Color -->
                <lcards-color-section
                    .editor=${this.editor}
                    basePath="icon_style.color"
                    header="Icon Colors"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>

                <!-- Background -->
                <lcards-form-section
                    header="Background"
                    description="Optional background behind icon"
                    ?expanded=${false}
                    headerLevel="6">

                    <lcards-color-section
                        .editor=${this.editor}
                        basePath="icon_style.background.color"
                        header="Background Colors"
                        .states=${['default', 'active', 'inactive', 'unavailable']}
                        ?expanded=${false}>
                    </lcards-color-section>

                    <lcards-form-field
                        .editor=${this.editor}
                        path="icon_style.background.radius"
                        label="Radius">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this.editor}
                        path="icon_style.background.padding"
                        label="Padding">
                    </lcards-form-field>
                </lcards-form-section>

                <!-- Padding -->
                <lcards-form-field
                    .editor=${this.editor}
                    path="icon_style.padding"
                    label="Icon Padding">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }
}

customElements.define('lcards-icon-editor', LCARdSIconEditor);
