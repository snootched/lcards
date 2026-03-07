/**
 * @fileoverview LCARdS Icon Editor
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
import '../shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from '../shared/lcards-form-field.js';
import './lcards-color-section-v2.js';
import '../shared/lcards-color-picker.js';
import './lcards-icon-area-picker.js';
import './lcards-padding-editor.js';

export class LCARdSIconEditor extends LitElement {

    static get properties() {
        return {
            editor: { type: Object },         // Parent editor reference
            hass: { type: Object },           // Home Assistant instance
            config: { type: Object }          // Config object (passed from parent for reactivity)
        };
    }

    constructor() {
        super();
        this.editor = null;
        this.hass = null;
        this.config = null;
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

        const showIcon = this.config?.show_icon;
        const iconAreaValid = ['left', 'right', 'top', 'bottom', 'none'];

        return html`
            <!-- Basic Icon Settings -->
            <lcards-form-section
                header="Icon Configuration"
                description="Enable and select icon"
                icon="mdi:shape"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this.editor, 'show_icon', {
                    label: 'Show Icon'
                })}

                ${showIcon ? html`
                    ${FormField.renderField(this.editor, 'icon', {
                        label: 'Icon'
                    })}
                ` : ''}
            </lcards-form-section>

            ${showIcon ? html`
                <!-- Icon Area Section -->
                <lcards-form-section
                    header="Icon Area"
                    description="Reserved space for icon on button"
                    icon="mdi:page-layout-sidebar-left"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    <lcards-icon-area-picker
                        .value=${this.config?.icon_area || 'left'}
                        label="Icon Area"
                        helper="Where icon's reserved space is ('none' = no divider, absolute positioning)"
                        @value-changed=${(e) => this.editor._setConfigValue('icon_area', e.detail.value)}>
                    </lcards-icon-area-picker>

                    ${FormField.renderField(this.editor, 'icon_area_size', {
                        label: 'Area Size',
                        helper: 'Override calculated area size (width for left/right, height for top/bottom)'
                    })}

                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="icon_area_background"
                        header="Area Background"
                        description="Background colour for entire icon area (matches legacy cards)"
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>

                    <!-- Divider Configuration -->
                    <lcards-form-section
                        header="Divider"
                        description="Line between icon area and text area"
                        icon="mdi:format-line-weight"
                        ?expanded=${false}
                        ?outlined=${true}
                        headerLevel="5">

                        ${FormField.renderField(this.editor, 'divider.width', {
                            label: 'Width',
                            helper: 'Divider line width (default: 6)'
                        })}

                        <lcards-color-picker
                            .hass=${this.hass}
                            .value=${this.editor._getConfigValue('divider.color') || ''}
                            @value-changed=${(e) => this.editor._setConfigValue('divider.color', e.detail.value)}>
                        </lcards-color-picker>
                    </lcards-form-section>
                </lcards-form-section>

                <!-- Icon Style Section -->
                <lcards-form-section
                    header="Icon Style"
                    description="Icon appearance and positioning"
                    icon="mdi:format-size"
                    ?expanded=${false}
                    ?outlined=${true}
                    headerLevel="4">

                    ${FormField.renderField(this.editor, 'icon_style.position', {
                        label: 'Position',
                        helper: 'Where to display the icon within its area'
                    })}

                    ${FormField.renderField(this.editor, 'icon_style.size', {
                        label: 'Size'
                    })}

                    ${FormField.renderField(this.editor, 'icon_style.rotation', {
                        label: 'Rotation (degrees)'
                    })}

                    <!-- Padding Configuration -->
                    <lcards-form-section
                        header="Padding"
                        description="Space around icon"
                        icon="mdi:arrow-expand-all"
                        ?expanded=${false}
                        ?outlined=${true}
                        headerLevel="5">

                        <lcards-padding-editor
                            .editor=${this.editor}
                            path="icon_style.padding"
                            label="Icon Padding"
                            helper="Spacing around the icon">
                        </lcards-padding-editor>
                    </lcards-form-section>

                    <!-- Icon Colors -->
                    <lcards-color-section-v2
                        .editor=${this.editor}
                        .config=${this.editor.config}
                        basePath="icon_style.color"
                        header="Icon Colour"
                        description="Foreground icon colour"
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                </lcards-form-section>
            ` : ''}
        `;
    }
}

customElements.define('lcards-icon-editor', LCARdSIconEditor);
