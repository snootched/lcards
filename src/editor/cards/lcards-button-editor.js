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
import '../components/form/lcards-unified-segment-editor.js';
import '../components/form/lcards-multi-action-editor.js';
import '../components/form/lcards-dpad-segment-picker.js';
// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

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
        // Check for segments - support both array (legacy) and object format
        const hasSegments = this.config.svg?.segments && 
                          (Array.isArray(this.config.svg.segments) ? this.config.svg.segments.length > 0 : Object.keys(this.config.svg.segments).length > 0);

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
            { label: 'Rules', content: () => this._renderRulesTab() },
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
                                <ha-select
                                    .value=${mode}
                                    @selected=${this._handleModeChange}
                                    @closed=${(e) => e.stopPropagation()}>
                                    <mwc-list-item value="preset">Preset (lozenge, bullet, etc.)</mwc-list-item>
                                    <mwc-list-item value="component">Component (dpad, sliders, etc.)</mwc-list-item>
                                </ha-select>
                                <div class="helper-text">
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
        // Check if segments are in object format (new) or array format (legacy)
        const segments = this.config.svg?.segments;
        const isObjectFormat = segments && typeof segments === 'object' && !Array.isArray(segments);
        
        if (isObjectFormat) {
            // New unified editor for object-based segments
            return html`
                <lcards-message
                    type="info"
                    message="Configure SVG segment interactions. Segments are auto-discovered from your SVG content. Use 'Default' to set common properties for all segments.">
                </lcards-message>
                <lcards-unified-segment-editor
                    .editor=${this}
                    mode="custom"
                    .segments=${this.config.svg?.segments || {}}
                    .discoveredSegmentIds=${this._getDiscoveredSegmentIds()}
                    ?showDefaults=${true}
                    .hass=${this.hass}>
                </lcards-unified-segment-editor>
            `;
        } else {
            // Legacy array-based editor (fallback)
            return html`
                <lcards-message
                    type="warning"
                    message="You are using the legacy array-based segment format. Consider migrating to the new object-based format for better consistency.">
                </lcards-message>
                <lcards-segment-list-editor
                    .editor=${this}
                    .segments=${this.config.svg?.segments || []}
                    .hass=${this.hass}
                    ?expanded=${true}
                    @value-changed=${this._handleSegmentsChange}>
                </lcards-segment-list-editor>
            `;
        }
    }

    /**
     * Get discovered segment IDs from SVG content
     * @returns {Array<string>}
     * @private
     */
    _getDiscoveredSegmentIds() {
        const svgContent = this.config.svg?.content;
        if (!svgContent) return [];
        
        // Reuse button card's extraction logic
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            
            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                return [];
            }
            
            const elementsWithIds = doc.querySelectorAll('[id]');
            return Array.from(elementsWithIds).map(el => el.id);
        } catch (error) {
            return [];
        }
    }

    /**
     * Component tab - for component mode
     */
    _renderComponentTab() {
        const componentType = this.config.component || 'dpad';
        if (componentType === 'dpad') {
            // Use unified segment editor for dpad
            const segments = ['center', 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
            return html`
                <lcards-message
                    type="info"
                    message="Configure your D-pad remote control. Use 'Default' to set common properties for all segments, then override per-segment as needed.">
                </lcards-message>
                <lcards-unified-segment-editor
                    .editor=${this}
                    mode="dpad"
                    .segments=${this.config.dpad?.segments || {}}
                    .predefinedSegmentIds=${segments}
                    ?showDefaults=${true}
                    .hass=${this.hass}>
                </lcards-unified-segment-editor>
            `;
        }
        return html`
            <lcards-message
                type="info"
                message="Component editor for ${componentType} is not yet implemented.">
            </lcards-message>
        `;
    }

    /**
     * Rules tab - display-only rules dashboard
     */
    _renderRulesTab() {
        return html`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id || this.config.cardId || ''}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `;
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
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
