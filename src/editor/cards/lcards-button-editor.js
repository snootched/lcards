/**
 * LCARdS Button Editor
 *
 * Visual editor for LCARdS Button card. Demonstrates schema-driven form components.
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import '../components/common/lcards-card-config-section.js';
import '../components/common/lcards-action-editor.js';
import '../components/common/lcards-message.js';
import '../components/common/lcards-divider.js';
import '../components/yaml/lcards-monaco-yaml-editor.js';
// Import form components
import '../components/form/lcards-form-field.js';
import '../components/form/lcards-form-section.js';
import '../components/form/lcards-grid-layout.js';
import '../components/form/lcards-color-section.js';
// Import new enhanced components
import '../components/form/lcards-multi-text-editor.js';
import '../components/form/lcards-icon-editor.js';
import '../components/form/lcards-border-editor.js';
import '../components/form/lcards-segment-list-editor.js';
import '../components/form/lcards-multi-action-editor.js';

export class LCARdSButtonEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'button'; // Set card type for schema lookup
    }

    /**
     * Get tab definitions for Button editor
     * @returns {Array<Object>} Tab configuration
     * @override
     */
    _getTabDefinitions() {
        const hasSegments = this.config.svg?.segments && this.config.svg.segments.length > 0;
        
        const tabs = [
            {
                label: 'Config',
                content: () => this._renderCardConfigTab()
            },
            {
                label: 'Text & Icon',
                content: () => this._renderTextIconTab()
            },
            {
                label: 'Colors',
                content: () => this._renderColorsTab()
            },
            {
                label: 'Border',
                content: () => this._renderBorderTab()
            },
            {
                label: 'Actions',
                content: () => this._renderActionsTab()
            }
        ];

        // Conditionally add Segments tab if segments exist
        if (hasSegments) {
            tabs.push({
                label: 'Segments',
                content: () => this._renderSegmentsTab()
            });
        }

        tabs.push(
            {
                label: 'Advanced',
                content: () => this._renderAdvancedTab()
            },
            {
                label: 'YAML',
                content: () => this._renderYamlTab()
            }
        );

        return tabs;
    }

    /**
     * Render Card Configuration tab (using new components)
     * @returns {TemplateResult}
     * @private
     */
    _renderCardConfigTab() {
        return html`
            <!-- Info Message -->
            <lcards-message
                type="info"
                message="Configure the basic settings for your LCARS button card. Select an entity to control or leave blank for a static button.">
            </lcards-message>

            <!-- Basic Configuration Section -->
            <lcards-form-section
                header="Basic Configuration"
                description="Core card settings"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-form-field
                    .editor=${this}
                    path="entity"
                    label="Entity">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this}
                    path="id"
                    label="Card ID"
                    helper="Optional custom ID for targeting with rules">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this}
                    path="preset"
                    label="Preset Style">
                </lcards-form-field>
            </lcards-form-section>

            <!-- Layout Section -->
            <lcards-form-section
                header="Layout"
                description="Grid positioning and sizing"
                icon="mdi:grid"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    <lcards-form-field
                        .editor=${this}
                        path="grid_columns"
                        label="Grid Columns">
                    </lcards-form-field>

                    <lcards-form-field
                        .editor=${this}
                        path="grid_rows"
                        label="Grid Rows">
                    </lcards-form-field>
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Render Text & Icon tab (using new enhanced components)
     * @returns {TemplateResult}
     * @private
     */
    _renderTextIconTab() {
        return html`
            <!-- Multi-Text Editor -->
            <lcards-multi-text-editor
                .editor=${this}
                .textConfig=${this.config.text || {}}
                .presetFields=${['name', 'label', 'state']}
                .hass=${this.hass}
                @value-changed=${(e) => this._setConfigValue('text', e.detail.value)}>
            </lcards-multi-text-editor>

            <!-- Icon Editor -->
            <lcards-icon-editor
                .editor=${this}
                path="icon"
                label="Icon Configuration"
                .hass=${this.hass}
                @value-changed=${(e) => this._setConfigValue('icon', e.detail.value)}>
            </lcards-icon-editor>

            <!-- Icon Area -->
            <lcards-form-section
                header="Icon Area"
                description="Configure the icon's reserved space location"
                icon="mdi:image-area"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-form-field
                    .editor=${this}
                    path="icon_area"
                    label="Icon Area">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }



    /**
     * Render Actions tab (using multi-action editor)
     * @returns {TemplateResult}
     * @private
     */
    _renderActionsTab() {
        return html`
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{
                    tap_action: this.config.tap_action || { action: 'toggle' },
                    hold_action: this.config.hold_action || { action: 'more-info' },
                    double_tap_action: this.config.double_tap_action || { action: 'none' }
                }}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `;
    }

    /**
     * Handle actions change from multi-action editor
     * @param {CustomEvent} event - value-changed event
     * @private
     */
    _handleActionsChange(event) {
        const actions = event.detail.value;
        this._updateConfig({
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        });
    }

    /**
     * Render Colors tab
     * @returns {TemplateResult}
     * @private
     */
    _renderColorsTab() {
        return html`
            <lcards-color-section
                .editor=${this}
                basePath="style.color.background"
                header="Card Background Colors"
                description="Background colors for different states"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${true}>
            </lcards-color-section>

            <lcards-color-section
                .editor=${this}
                basePath="style.color.text"
                header="Text Colors"
                description="Text colors for different states"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>

            <lcards-color-section
                .editor=${this}
                basePath="style.color.icon"
                header="Icon Colors"
                description="Icon colors for different states"
                .states=${['default', 'active', 'inactive', 'unavailable']}
                ?expanded=${false}>
            </lcards-color-section>
        `;
    }

    /**
     * Render Border tab
     * @returns {TemplateResult}
     * @private
     */
    _renderBorderTab() {
        return html`
            <lcards-border-editor
                .editor=${this}
                path="style.border"
                label="Border Configuration"
                ?showPreview=${true}
                @value-changed=${(e) => this._setConfigValue('style.border', e.detail.value)}>
            </lcards-border-editor>
        `;
    }

    /**
     * Render Segments tab (conditional)
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentsTab() {
        return html`
            <lcards-segment-list-editor
                .editor=${this}
                .segments=${this.config.svg?.segments || []}
                .hass=${this.hass}
                ?expanded=${true}
                @value-changed=${this._handleSegmentsChange}>
            </lcards-segment-list-editor>
        `;
    }

    /**
     * Handle segments change
     * @param {CustomEvent} event - value-changed event
     * @private
     */
    _handleSegmentsChange(event) {
        const segments = event.detail.value;
        this._updateConfig({
            svg: {
                ...(this.config.svg || {}),
                segments
            }
        });
    }

    /**
     * Render Advanced tab (placeholder for future features)
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedTab() {
        return html`
            <lcards-message
                type="info"
                message="Advanced features (animations, SVG backgrounds) will be added in Phase 2.">
            </lcards-message>

            <lcards-form-section
                header="Advanced Options"
                description="Additional configuration options"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-form-field
                    .editor=${this}
                    path="css_class"
                    label="Custom CSS Class"
                    helper="Add custom CSS class for styling">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }

    /**
     * Render YAML editor tab
     * @returns {TemplateResult}
     * @private
     */
    _renderYamlTab() {
        return html`
            <div class="section">
                <div class="section-description">
                    Advanced YAML editor with validation. Changes made here will be reflected in the visual tabs.
                </div>
                <lcards-monaco-yaml-editor
                    .value=${this._yamlValue}
                    .schema=${this._getSchema()}
                    .errors=${this._validationErrors}
                    @value-changed=${this._handleYamlChange}>
                </lcards-monaco-yaml-editor>
            </div>
        `;
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
