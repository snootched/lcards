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
// Import dpad segment picker
import '../components/form/lcards-dpad-segment-picker.js';

export class LCARdSButtonEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'button'; // Set card type for schema lookup
        this._selectedSegmentId = 'center'; // Default selected segment
    }

    static get properties() {
        return {
            ...super.properties,
            _selectedSegmentId: { type: String, state: true }
        };
    }

    /**
     * Get tab definitions for Button editor
     * @returns {Array<Object>} Tab configuration
     * @override
     */
    _getTabDefinitions() {
        // Detect mode: component mode if config.component exists, otherwise preset mode
        const mode = this.config.component ? 'component' : 'preset';
        const hasSegments = this.config.svg?.segments && this.config.svg.segments.length > 0;

        const tabs = [
            {
                label: 'Config',
                content: () => this._renderCardConfigTab()
            }
        ];

        // Show preset-specific tabs only in preset mode
        if (mode === 'preset') {
            tabs.push(
                {
                    label: 'Card & Border',
                    content: () => this._renderCardBorderTab()
                },
                {
                    label: 'Text',
                    content: () => this._renderTextTab()
                },
                {
                    label: 'Icon',
                    content: () => this._renderIconTab()
                }
            );
        }

        // Show component tab in component mode
        if (mode === 'component') {
            tabs.push({
                label: 'Component',
                content: () => this._renderComponentTab()
            });
        }

        // Actions tab is shown in both modes
        tabs.push({
            label: 'Actions',
            content: () => this._renderActionsTab()
        });

        // Conditionally add Segments tab if custom SVG segments exist or component mode
        if (hasSegments || mode === 'component') {
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
        const mode = this.config.component ? 'component' : 'preset';

        return html`
            <!-- Info Message -->
            <lcards-message
                type="info"
                message="Configure the basic settings for your LCARdS button card. Select an entity to control or leave blank for a static button.">
            </lcards-message>

            <!-- Mode Selector Section -->
            <lcards-form-section
                header="Configuration Mode"
                description="Choose between preset-based buttons or component-based controls"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <div class="form-row">
                    <label>Mode</label>
                    <select
                        .value=${mode}
                        @change=${this._handleModeChange}
                        style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color);">
                        <option value="preset">Preset (lozenge, bullet, etc.)</option>
                        <option value="component">Component (dpad, sliders, etc.)</option>
                    </select>
                    <div style="margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">
                        ${mode === 'preset' 
                            ? 'Preset mode: Use shape presets with text, icons, and styling' 
                            : 'Component mode: Use complex interactive components like dpads'}
                    </div>
                </div>
            </lcards-form-section>

            <!-- Basic Configuration Section -->
            <lcards-form-section
                header="Basic Configuration"
                description="Core card settings"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${mode === 'preset' ? html`
                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="preset"
                        label="Preset Style">
                    </lcards-form-field>
                ` : html`
                    <lcards-form-field
                        .editor=${this}
                        .config=${this.config}
                        path="component"
                        label="Component Type">
                    </lcards-form-field>
                `}

                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="entity"
                    label="Entity">
                </lcards-form-field>

                <lcards-form-field
                    .editor=${this}
                    .config=${this.config}
                    path="id"
                    label="Card ID"
                    helper="[Optional] Custom ID for targeting with rules and animations">
                </lcards-form-field>
            </lcards-form-section>
        `;
    }

    /**
     * Handle mode change (preset vs component)
     * @param {Event} event - Change event
     * @private
     */
    _handleModeChange(event) {
        const newMode = event.target.value;

        if (newMode === 'component') {
            // Switch to component mode
            const updates = {
                component: 'dpad',  // Default to dpad
                preset: undefined   // Clear preset
            };
            this._updateConfig(updates);
        } else {
            // Switch to preset mode
            const updates = {
                component: undefined,  // Clear component
                dpad: undefined,       // Clear dpad config
                preset: 'lozenge'      // Default to lozenge
            };
            this._updateConfig(updates);
        }

        // Force tab refresh
        this.requestUpdate();
    }

    /**
     * Render Text tab (using new enhanced components)
     * @returns {TemplateResult}
     * @private
     */
    _renderTextTab() {
        return html`
            <!-- Multi-Text Editor -->
            <lcards-multi-text-editor
                .editor=${this}
                .hass=${this.hass}>
            </lcards-multi-text-editor>
        `;
    }

    /**
     * Render Icon tab (using new enhanced components)
     * @returns {TemplateResult}
     * @private
     */
    _renderIconTab() {
        return html`
            <!-- Icon Editor -->
            <lcards-icon-editor
                .editor=${this}
                .hass=${this.hass}
                .config=${this.config}>
            </lcards-icon-editor>
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
     * Render Card & Border tab (combining legacy card/border sections)
     * @returns {TemplateResult}
     * @private
     */
    _renderCardBorderTab() {
        return html`
            <!-- Card Background Colors -->
            <lcards-form-section
                header="Card Background"
                description="Background colors by state"
                icon="mdi:format-color-fill"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-color-section
                    .editor=${this}
                    .config=${this.config}
                    basePath="style.card.color.background"
                    header="Background Colors"
                    description="Card background color for each state"
                    .states=${['default', 'active', 'inactive', 'unavailable']}
                    ?expanded=${false}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Borders & Corners -->
            <lcards-border-editor
                .editor=${this}
                path="style.border"
                label="Borders & Corners"
                ?showPreview=${true}>
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
     * Render Component tab (for component mode)
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentTab() {
        const componentType = this.config.component || 'dpad';

        // For dpad component
        if (componentType === 'dpad') {
            return this._renderDpadComponentEditor();
        }

        // Fallback for other components
        return html`
            <lcards-message
                type="info"
                message="Component editor for ${componentType} is not yet implemented.">
            </lcards-message>
        `;
    }

    /**
     * Render D-pad component editor
     * @returns {TemplateResult}
     * @private
     */
    _renderDpadComponentEditor() {
        const segmentConfigs = this.config.dpad?.segments || {};
        const activeSegmentConfig = segmentConfigs[this._selectedSegmentId] || {};

        return html`
            <lcards-message
                type="info"
                message="Configure your D-pad remote control. Click a segment below to edit its configuration.">
            </lcards-message>

            <!-- Visual Segment Selector -->
            <lcards-form-section
                header="D-Pad Segment Selector"
                description="Click a segment to select it for editing"
                icon="mdi:gamepad"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-dpad-segment-picker
                    .value=${this._selectedSegmentId}
                    .segmentConfigs=${segmentConfigs}
                    .label=${'Select Segment to Edit'}
                    .helper=${'Green cells are configured. Click any cell to edit that segment.'}
                    @value-changed=${this._handleSegmentSelect}>
                </lcards-dpad-segment-picker>
            </lcards-form-section>

            <!-- Active Segment Configuration -->
            <lcards-form-section
                header="${this._formatSegmentLabel(this._selectedSegmentId)} Configuration"
                description="Configure actions and appearance for this segment"
                icon="mdi:cog"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <!-- Entity Override -->
                <div class="form-row">
                    <label>Entity (optional override)</label>
                    <ha-entity-picker
                        .hass=${this.hass}
                        .value=${activeSegmentConfig.entity || ''}
                        @value-changed=${(e) => this._updateActiveSegmentProperty('entity', e.detail.value)}
                        allow-custom-entity>
                    </ha-entity-picker>
                    <div style="margin-top: 4px; font-size: 11px; color: var(--secondary-text-color);">
                        Leave empty to inherit from card entity
                    </div>
                </div>

                <!-- Actions -->
                <lcards-multi-action-editor
                    .hass=${this.hass}
                    .actions=${{
                        tap_action: activeSegmentConfig.tap_action || { action: 'none' },
                        hold_action: activeSegmentConfig.hold_action || { action: 'none' },
                        double_tap_action: activeSegmentConfig.double_tap_action || { action: 'none' }
                    }}
                    @value-changed=${this._handleActiveSegmentActionsChange}>
                </lcards-multi-action-editor>

                <!-- Animations (optional) -->
                ${activeSegmentConfig.animations && activeSegmentConfig.animations.length > 0 ? html`
                    <div style="margin-top: 16px; padding: 12px; background: var(--secondary-background-color); border-radius: 4px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Animations</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            ${activeSegmentConfig.animations.length} animation(s) configured
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: var(--secondary-text-color);">
                            Advanced animation configuration is available in the YAML tab
                        </div>
                    </div>
                ` : html`
                    <div style="margin-top: 16px; padding: 12px; background: var(--secondary-background-color); border-radius: 4px;">
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            No animations configured. Add animations via the YAML tab.
                        </div>
                    </div>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Format segment ID for display
     * @param {string} segmentId - Segment ID
     * @returns {string} Formatted label
     * @private
     */
    _formatSegmentLabel(segmentId) {
        if (!segmentId) return 'Segment';
        return segmentId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Handle segment selection change
     * @param {CustomEvent} event - value-changed event
     * @private
     */
    _handleSegmentSelect(event) {
        this._selectedSegmentId = event.detail.value;
        this.requestUpdate();
    }

    /**
     * Update active segment property
     * @param {string} property - Property name
     * @param {*} value - New value
     * @private
     */
    _updateActiveSegmentProperty(property, value) {
        const segmentConfigs = this.config.dpad?.segments || {};
        const updatedSegmentConfig = {
            ...(segmentConfigs[this._selectedSegmentId] || {}),
            [property]: value
        };

        // Remove property if value is empty/null
        if (!value || value === '') {
            delete updatedSegmentConfig[property];
        }

        this._updateConfig({
            dpad: {
                ...(this.config.dpad || {}),
                segments: {
                    ...segmentConfigs,
                    [this._selectedSegmentId]: updatedSegmentConfig
                }
            }
        });
    }

    /**
     * Handle active segment actions change
     * @param {CustomEvent} event - value-changed event
     * @private
     */
    _handleActiveSegmentActionsChange(event) {
        const actions = event.detail.value;
        const segmentConfigs = this.config.dpad?.segments || {};
        const updatedSegmentConfig = {
            ...(segmentConfigs[this._selectedSegmentId] || {}),
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        };

        // Remove actions if they're set to 'none'
        if (updatedSegmentConfig.tap_action?.action === 'none') {
            delete updatedSegmentConfig.tap_action;
        }
        if (updatedSegmentConfig.hold_action?.action === 'none') {
            delete updatedSegmentConfig.hold_action;
        }
        if (updatedSegmentConfig.double_tap_action?.action === 'none') {
            delete updatedSegmentConfig.double_tap_action;
        }

        this._updateConfig({
            dpad: {
                ...(this.config.dpad || {}),
                segments: {
                    ...segmentConfigs,
                    [this._selectedSegmentId]: updatedSegmentConfig
                }
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
                    .config=${this.config}
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
