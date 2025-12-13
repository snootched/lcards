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
            hass: { type: Object }            // Home Assistant instance
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.hass = null;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
        `;
    }

    render() {
        if (!this.editor) {
            return html`<div>Icon editor requires 'editor' property</div>`;
        }

        const showIcon = this.editor.config?.show_icon;

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

                <!-- Icon Position -->
                ${showIcon ? html`
                    <lcards-form-field
                        .editor=${this.editor}
                        path="icon_style.position"
                        label="Position"
                        helper="Where to display the icon on the card">
                    </lcards-form-field>
                ` : ''}

                <!-- Icon Style Section -->
                ${showIcon ? html`
                    <lcards-form-section
                        header="Icon Style"
                        description="Icon sizing and positioning"
                        icon="mdi:format-size"
                        ?expanded=${true}
                        ?outlined=${true}
                        ?noCollapse=${true}
                        headerLevel="5">

                        <lcards-form-field
                            .editor=${this.editor}
                            path="icon_style.size"
                            label="Size">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this.editor}
                            path="icon_style.justify"
                            label="Justify"
                            helper="Horizontal justification within the container">
                        </lcards-form-field>

                        <lcards-form-field
                            .editor=${this.editor}
                            path="icon_style.rotation"
                            label="Rotation (degrees)">
                        </lcards-form-field>
                    </lcards-form-section>

                    <!-- Colors Section -->
                    <lcards-form-section
                        header="Colours"
                        description="Icon and background colors"
                        icon="mdi:select-color"
                        ?expanded=${false}
                        ?outlined=${true}
                        headerLevel="5">

                        <!-- Foreground Colors -->
                        <lcards-form-section
                            header="Foreground"
                            description="Icon color"
                            ?expanded=${true}
                            ?outlined=${true}
                            ?noCollapse=${true}
                            headerLevel="6">

                            <lcards-color-section
                                .editor=${this.editor}
                                basePath="icon_style.color"
                                header="Default Colour (no entity/state)"
                                .states=${['default']}
                                ?expanded=${true}>
                            </lcards-color-section>

                            <lcards-color-section
                                .editor=${this.editor}
                                basePath="icon_style.color"
                                header="State Colours"
                                .states=${['active', 'inactive', 'unavailable']}
                                ?expanded=${false}>
                            </lcards-color-section>
                        </lcards-form-section>

                        <!-- Background Colors -->
                        <lcards-form-section
                            header="Background"
                            description="Optional background behind icon"
                            ?expanded=${false}
                            ?outlined=${true}
                            headerLevel="6">

                            <lcards-color-section
                                .editor=${this.editor}
                                basePath="icon_style.background.color"
                                header="Default Colour (no entity/state)"
                                .states=${['default']}
                                ?expanded=${true}>
                            </lcards-color-section>

                            <lcards-color-section
                                .editor=${this.editor}
                                basePath="icon_style.background.color"
                                header="State Colours"
                                .states=${['active', 'inactive', 'unavailable']}
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
                    </lcards-form-section>

                    <!-- Icon Padding -->
                    <lcards-form-field
                        .editor=${this.editor}
                        path="icon_style.padding"
                        label="Icon Padding">
                    </lcards-form-field>
                ` : ''}
            </lcards-form-section>
        `;
    }
}

customElements.define('lcards-icon-editor', LCARdSIconEditor);
