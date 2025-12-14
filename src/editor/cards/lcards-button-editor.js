/**
 * LCARdS Button Editor
 *
 * Visual editor for LCARdS Button card using declarative configuration.
 * Simplified from 617 lines to ~150 lines using the base editor's _renderFromConfig() method.
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import '../components/common/lcards-message.js';
import '../components/yaml/lcards-monaco-yaml-editor.js';
// Import form components
import '../components/form/lcards-form-field.js';
import '../components/form/lcards-form-section.js';
import '../components/form/lcards-grid-layout.js';
import '../components/form/lcards-color-section.js';
// Import enhanced components
import '../components/form/lcards-multi-text-editor.js';
import '../components/form/lcards-icon-editor.js';
import '../components/form/lcards-border-editor.js';
import '../components/form/lcards-segment-list-editor.js';
import '../components/form/lcards-multi-action-editor.js';
import '../components/form/lcards-dpad-segment-picker.js';

export class LCARdSButtonEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'button';
    }

    /**
     * Get tab definitions
     */
    _getTabDefinitions() {
        const mode = this.config.component ? 'component' : 'preset';
        const hasSegments = this.config.svg?.segments && this.config.svg.segments.length > 0;

        const tabs = [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) }
        ];

        if (mode === 'preset') {
            tabs.push(
                { label: 'Card & Border', content: () => this._renderFromConfig(this._getCardBorderTabConfig()) },
                { label: 'Text', content: () => this._renderTextTab() },
                { label: 'Icon', content: () => this._renderIconTab() }
            );
        }

        if (mode === 'component') {
            tabs.push({ label: 'Component', content: () => this._renderComponentTab() });
        }

        tabs.push({ label: 'Actions', content: () => this._renderActionsTab() });

        if (hasSegments || mode === 'component') {
            tabs.push({ label: 'Segments', content: () => this._renderSegmentsTab() });
        }

        tabs.push(
            { label: 'Advanced', content: () => this._renderFromConfig(this._getAdvancedTabConfig()) },
            { label: 'YAML', content: () => this._renderYamlTab() }
        );

        return tabs;
    }

    /**
     * Config tab - declarative configuration
     */
    _getConfigTabConfig() {
        const mode = this.config.component ? 'component' : 'preset';

        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure the basic settings for your LCARdS button card. Select an entity to control or leave blank for a static button.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Configuration Mode',
                description: 'Choose between preset-based buttons or component-based controls',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'custom',
                        render: () => html`
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
                        `
                    }
                ]
            },
            {
                type: 'section',
                header: 'Basic Configuration',
                description: 'Core card settings',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    { type: 'field', path: mode === 'preset' ? 'preset' : 'component', label: mode === 'preset' ? 'Preset Style' : 'Component Type' },
                    { type: 'field', path: 'entity', label: 'Entity' },
                    { type: 'field', path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' }
                ]
            }
        ];
    }

    /**
     * Card & Border tab - declarative configuration
     */
    _getCardBorderTabConfig() {
        return [
            {
                type: 'section',
                header: 'Card Background',
                description: 'Background colors by state',
                icon: 'mdi:format-color-fill',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'custom',
                        render: () => html`
                            <lcards-color-section
                                .editor=${this}
                                .config=${this.config}
                                basePath="style.card.color.background"
                                header="Background Colors"
                                description="Card background color for each state"
                                .states=${['default', 'active', 'inactive', 'unavailable']}
                                ?expanded=${false}>
                            </lcards-color-section>
                        `
                    }
                ]
            },
            {
                type: 'custom',
                render: () => html`
                    <lcards-border-editor
                        .editor=${this}
                        path="style.border"
                        label="Borders & Corners"
                        ?showPreview=${true}>
                    </lcards-border-editor>
                `
            }
        ];
    }

    /**
     * Advanced tab - declarative configuration
     */
    _getAdvancedTabConfig() {
        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Advanced features (animations, SVG backgrounds) will be added in Phase 2.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Advanced Options',
                description: 'Additional configuration options',
                icon: 'mdi:cog',
                expanded: true,
                outlined: true,
                children: [
                    { type: 'field', path: 'css_class', label: 'Custom CSS Class', helper: 'Add custom CSS class for styling' }
                ]
            }
        ];
    }

    /**
     * Text tab - uses enhanced component
     */
    _renderTextTab() {
        return html`
            <lcards-multi-text-editor
                .editor=${this}
                .hass=${this.hass}>
            </lcards-multi-text-editor>
        `;
    }

    /**
     * Icon tab - uses enhanced component
     */
    _renderIconTab() {
        return html`
            <lcards-icon-editor
                .editor=${this}
                .hass=${this.hass}
                .config=${this.config}>
            </lcards-icon-editor>
        `;
    }

    /**
     * Actions tab - uses multi-action editor
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
     * Segments tab - uses segment list editor
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
     * Component tab - for component mode
     */
    _renderComponentTab() {
        const componentType = this.config.component || 'dpad';
        if (componentType === 'dpad') {
            return this._renderFromConfig(this._getDpadTabConfig());
        }
        return html`
            <lcards-message
                type="info"
                message="Component editor for ${componentType} is not yet implemented.">
            </lcards-message>
        `;
    }

    /**
     * D-pad tab - declarative configuration
     */
    _getDpadTabConfig() {
        const segments = ['center', 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];

        return [
            {
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure your D-pad remote control. Each segment can have its own entity, actions, and colors.">
                    </lcards-message>
                `
            },
            // Default segment colors
            {
                type: 'section',
                header: 'Default Segment Colors',
                description: 'Default colors for all segments (can be overridden per segment)',
                icon: 'mdi:palette',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'custom',
                        render: () => html`
                            <lcards-color-section
                                .editor=${this}
                                .config=${this.config}
                                basePath="dpad.default.color"
                                header="Default Colors"
                                description="State-based colors for all segments"
                                .states=${['default', 'active', 'inactive', 'unavailable']}
                                ?expanded=${true}>
                            </lcards-color-section>
                        `
                    }
                ]
            },
            // Per-segment configuration
            ...segments.map(segmentId => ({
                type: 'section',
                header: this._formatSegmentLabel(segmentId),
                description: `Configure ${this._formatSegmentLabel(segmentId)} segment`,
                icon: this._getSegmentIcon(segmentId),
                expanded: segmentId === 'center',
                outlined: true,
                children: [
                    // Entity override
                    {
                        type: 'field',
                        path: `dpad.segments.${segmentId}.entity`,
                        label: 'Entity Override',
                        helper: 'Leave empty to inherit from card entity'
                    },
                    // Actions
                    {
                        type: 'custom',
                        render: () => html`
                            <lcards-multi-action-editor
                                .hass=${this.hass}
                                .actions=${this._getSegmentActions(segmentId)}
                                @value-changed=${(e) => this._handleSegmentActionsChange(segmentId, e)}>
                            </lcards-multi-action-editor>
                        `
                    },
                    // State colors
                    {
                        type: 'custom',
                        render: () => html`
                            <lcards-color-section
                                .editor=${this}
                                .config=${this.config}
                                basePath="dpad.segments.${segmentId}.color"
                                header="Segment Colors"
                                description="State-based colors (overrides defaults)"
                                .states=${['default', 'active', 'inactive', 'unavailable']}
                                ?expanded=${false}>
                            </lcards-color-section>
                        `
                    }
                ]
            }))
        ];
    }

    /**
     * Get icon for segment
     */
    _getSegmentIcon(segmentId) {
        const iconMap = {
            'center': 'mdi:gamepad-round',
            'up': 'mdi:gamepad-up',
            'down': 'mdi:gamepad-down',
            'left': 'mdi:gamepad-left',
            'right': 'mdi:gamepad-right',
            'up-left': 'mdi:numeric-1-circle',
            'up-right': 'mdi:numeric-2-circle',
            'down-left': 'mdi:numeric-3-circle',
            'down-right': 'mdi:numeric-4-circle'
        };
        return iconMap[segmentId] || 'mdi:gamepad';
    }

    /**
     * Get segment actions
     */
    _getSegmentActions(segmentId) {
        const segmentConfig = this.config.dpad?.segments?.[segmentId] || {};
        return {
            tap_action: segmentConfig.tap_action || { action: 'none' },
            hold_action: segmentConfig.hold_action || { action: 'none' },
            double_tap_action: segmentConfig.double_tap_action || { action: 'none' }
        };
    }

    /**
     * Handle segment actions change
     */
    _handleSegmentActionsChange(segmentId, event) {
        const actions = event.detail.value;
        const segmentConfigs = this.config.dpad?.segments || {};
        const updatedSegmentConfig = {
            ...(segmentConfigs[segmentId] || {}),
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        };

        // Remove actions if they're set to 'none'
        ['tap_action', 'hold_action', 'double_tap_action'].forEach(key => {
            if (updatedSegmentConfig[key]?.action === 'none') {
                delete updatedSegmentConfig[key];
            }
        });

        this._updateConfig({
            dpad: {
                ...(this.config.dpad || {}),
                segments: { ...segmentConfigs, [segmentId]: updatedSegmentConfig }
            }
        });
    }

    /**
     * YAML editor tab
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

    // Event Handlers

    _handleModeChange(event) {
        const newMode = event.target.value;
        if (newMode === 'component') {
            this._updateConfig({ component: 'dpad', preset: undefined });
        } else {
            this._updateConfig({ component: undefined, dpad: undefined, preset: 'lozenge' });
        }
        this.requestUpdate();
    }

    _handleActionsChange(event) {
        const actions = event.detail.value;
        this._updateConfig({
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        });
    }

    _handleSegmentsChange(event) {
        this._updateConfig({
            svg: { ...(this.config.svg || {}), segments: event.detail.value }
        });
    }

    _formatSegmentLabel(segmentId) {
        if (!segmentId) return 'Segment';
        return segmentId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
