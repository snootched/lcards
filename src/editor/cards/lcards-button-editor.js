/**
 * LCARdS Button Editor
 *
 * Visual editor for LCARdS Button card using declarative configuration.
 * Simplified from 617 lines to ~150 lines using the base editor's _renderFromConfig() method.
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { configToYaml } from '../utils/yaml-utils.js';
import '../components/shared/lcards-message.js';
import '../components/yaml/lcards-yaml-editor.js';
// Import shared form components
import '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
// Import specialized editor components
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-multi-text-editor.js';
import '../components/editors/lcards-icon-editor.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-unified-segment-editor.js';
import '../components/editors/lcards-multi-action-editor.js';
// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';
// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';
// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';
import '../components/theme-browser/lcards-theme-token-browser-tab.js';
import '../components/provenance/lcards-provenance-tab.js';

export class LCARdSButtonEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'button';
    }

    /**
     * Get current editor mode
     * @returns {'preset'|'component'|'svg'}
     * @private
     */
    _getMode() {
        if (this.config.component) return 'component';
        if (this.config.svg !== undefined) return 'svg'; // Check for svg object existence, not content
        return 'preset';
    }

    /**
     * Get tab definitions
     */
    _getTabDefinitions() {
        const mode = this._getMode();

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

        // Show Actions tab only in preset mode (component/svg have per-segment actions)
        if (mode === 'preset') {
            tabs.push({ label: 'Actions', content: () => this._renderActionsTab() });
        }

        // Show Segments tab for component (dpad) and svg modes
        if (mode === 'component' || mode === 'svg') {
            tabs.push({ label: 'Segments', content: () => this._renderSegmentsTab() });
        }

        return [...tabs, ...this._getUtilityTabs()];
    }

    /**
     * Config tab - Mode selection and basic settings
     * @returns {Array} Config tab definition
     * @private
     */
    _getConfigTabConfig() {
        const mode = this._getMode();

        return this._buildConfigTab({
            infoMessage: 'Configure the basic settings for your LCARdS button card. Select an entity to control or leave blank for a static button.',
            modeSections: [
                {
                    type: 'section',
                    header: 'Configuration Mode',
                    description: 'Choose between preset buttons, custom SVG, or interactive components',
                    icon: 'mdi:cog',
                    expanded: true,
                    outlined: true,
                    children: [
                        {
                            type: 'custom',
                            render: () => html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Mode'}
                                    .helper=${mode === 'preset'
                                        ? 'Preset mode: Use shape presets with text, icons, and styling'
                                        : mode === 'svg'
                                        ? 'Custom SVG mode: Use your own SVG with interactive segments'
                                        : 'Component mode: Use complex interactive components like dpads'}
                                    .selector=${{
                                        select: {
                                            mode: 'dropdown',
                                            options: [
                                                { value: 'preset', label: 'Buttons (preset: lozenge, bullet, etc.)' },
                                                { value: 'component', label: 'SVG Components (component: dpad, etc.)' },
                                                { value: 'svg', label: 'Custom SVG with Segments (svg: )' }
                                            ]
                                        }
                                    }}
                                    .value=${mode}
                                    @value-changed=${this._handleModeChange}>
                                </ha-selector>
                            `
                        },
                        ...(mode === 'preset' ? [
                            { type: 'field', path: 'preset', label: 'Preset Style' }
                        ] : []),
                        ...(mode === 'component' ? [
                            { type: 'field', path: 'component', label: 'Component Type' }
                        ] : []),
                        ...(mode === 'svg' ? [
                            {
                                type: 'custom',
                                render: () => html`
                                    <lcards-message
                                        type="info"
                                        message="Use the Segments tab to configure your custom SVG content and segment interactions.">
                                    </lcards-message>
                                `
                            }
                        ] : [])
                    ]
                }
            ]
            // basicFields uses default: entity, id, tags
        });
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
                    tap_action: this.config.tap_action,
                    hold_action: this.config.hold_action,
                    double_tap_action: this.config.double_tap_action
                }}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `;
    }

    /**
     * Segments tab - uses unified segment editor for both modes
     */
    _renderSegmentsTab() {
        const mode = this._getMode();

        if (mode === 'component') {
            // Component mode (e.g., dpad): predefined segments
            const componentType = this.config.component || 'dpad';

            if (componentType === 'dpad') {
                const predefinedSegments = ['center', 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
                return html`
                    <lcards-message
                        type="info"
                        message="Configure your D-pad remote control. Use 'Default' to set common properties for all segments, then override per-segment as needed.">
                    </lcards-message>
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        .segments=${this.config.dpad?.segments || {}}
                        .predefinedSegmentIds=${predefinedSegments}
                        ?showDefaults=${true}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                `;
            }

            // Other component types
            return html`
                <lcards-message
                    type="info"
                    message="Segment editor for ${componentType} is not yet implemented.">
                </lcards-message>
            `;
        } else if (mode === 'svg') {
            // Custom SVG mode: auto-discovered segments
            const discoveredIds = this._getDiscoveredSegmentIds();
            const parseError = this._getSvgParseError();

            return html`
                <lcards-message
                    type="info"
                    message="Paste your SVG markup below. Elements with 'id' attributes become interactive segments.">
                </lcards-message>

                <!-- SVG Content Field -->
                <lcards-form-section
                    header="SVG Content"
                    description="Paste or edit your SVG markup here"
                    icon="mdi:xml"
                    ?expanded=${true}
                    ?outlined=${true}>
                    <div class="form-row">
                        <ha-textarea
                            .value=${this.config.svg?.content || ''}
                            @input=${(e) => this.editor._setConfigValue('svg.content', e.target.value)}
                            placeholder="<svg viewBox='0 0 100 100'>...</svg>"
                            rows="10"
                            style="width: 100%; font-family: monospace;">
                        </ha-textarea>
                        <div class="helper-text">
                            ${discoveredIds.length > 0
                                ? `✓ Found ${discoveredIds.length} segment(s): ${discoveredIds.join(', ')}`
                                : 'No segments found. Add id attributes to your SVG elements.'}
                        </div>
                    </div>
                </lcards-form-section>

                ${parseError ? html`
                    <lcards-message
                        type="error"
                        message="SVG Parse Error: ${parseError}">
                    </lcards-message>
                ` : ''}

                <!-- Segment Configuration -->
                <lcards-message
                    type="info"
                    message="Configure segment interactions below. Use 'Default' to set common properties for all segments.">
                </lcards-message>

                <lcards-unified-segment-editor
                    .editor=${this}
                    mode="custom"
                    .segments=${this.config.svg?.segments || {}}
                    .discoveredSegmentIds=${discoveredIds}
                    ?showDefaults=${true}
                    .hass=${this.hass}>
                </lcards-unified-segment-editor>
            `;
        }

        // Should never reach here, but just in case
        return html`
            <lcards-message
                type="warning"
                message="Segments tab is only available in SVG or Component mode.">
            </lcards-message>
        `;
    }

    /**
     * Get discovered segment IDs from SVG content
     * @returns {Array<string>}
     * @private
     */
    _getDiscoveredSegmentIds() {
        const svgContent = this.config.svg?.content;
        if (!svgContent) {
            this._svgParseError = null; // Clear error when no content
            return [];
        }

        // Reuse button card's extraction logic
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                this._svgParseError = parseError.textContent || 'Invalid SVG markup';
                console.error('[LCARdS Button Editor] SVG parse error:', this._svgParseError);
                return [];
            }

            // Clear any previous parse errors on successful parse
            this._svgParseError = null;

            const elementsWithIds = doc.querySelectorAll('[id]');
            const segmentIds = Array.from(elementsWithIds).map(el => el.id);

            // Guarantee error is cleared when we successfully extracted IDs
            this._svgParseError = null;

            return segmentIds;
        } catch (error) {
            this._svgParseError = error.message || 'Failed to parse SVG';
            console.error('[LCARdS Button Editor] SVG parse exception:', error);
            return [];
        }
    }

    /**
     * Get SVG parse error if any
     * @returns {string|null}
     * @private
     */
    _getSvgParseError() {
        return this._svgParseError || null;
    }

    // Event Handlers

    _handleModeChange(event) {
        const newMode = event.detail.value;
        const currentMode = this._getMode();

        if (newMode === currentMode) return; // No change

        // Determine valid keys for this mode
        let validKeys = [];
        let modeSpecificConfig = {};

        if (newMode === 'preset') {
            // Preset mode: keep preset-related keys
            validKeys = ['preset', 'text', 'icon', 'show_icon', 'icon_area', 'icon_style', 'icon_area_background'];
            modeSpecificConfig.preset = 'lozenge';
        } else if (newMode === 'component') {
            // Component mode: keep component-related keys
            validKeys = ['component', 'dpad'];
            modeSpecificConfig.component = 'dpad';
            modeSpecificConfig.dpad = { segments: {} }; // Initialize with empty segments
        } else if (newMode === 'svg') {
            // SVG mode: keep svg-related keys
            validKeys = ['svg'];
            // Provide example SVG if no existing content
            const exampleSvg = `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Example interactive segments -->
  <rect id="segment-1" x="10" y="10" width="80" height="80" fill="#ff9800" rx="8"/>
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="14">Segment 1</text>

  <circle id="segment-2" cx="150" cy="50" r="40" fill="#2196f3"/>
  <text x="150" y="55" text-anchor="middle" fill="white" font-size="14">Segment 2</text>

  <rect id="segment-3" x="210" y="10" width="80" height="80" fill="#4caf50" rx="8"/>
  <text x="250" y="55" text-anchor="middle" fill="white" font-size="14">Segment 3</text>

  <path id="segment-4" d="M 10 120 L 140 120 L 75 180 Z" fill="#9c27b0"/>
  <text x="75" y="150" text-anchor="middle" fill="white" font-size="14">Segment 4</text>

  <ellipse id="segment-5" cx="220" cy="150" rx="70" ry="40" fill="#f44336"/>
  <text x="220" y="155" text-anchor="middle" fill="white" font-size="14">Segment 5</text>
</svg>`;

            modeSpecificConfig.svg = {
                content: this.config.svg?.content || exampleSvg,
                segments: {} // Initialize with empty segments
            };
        }

        // Use base editor helper to clean config
        const newConfig = this._cleanConfigForMode(this.config, newMode, validKeys);

        // Add mode-specific configuration
        Object.assign(newConfig, modeSpecificConfig);

        // Replace config and notify Home Assistant
        this.config = newConfig;
        this._yamlValue = configToYaml(this.config);
        this._validateConfig();

        // Fire config-changed event for Home Assistant
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));

        this.requestUpdate();
    }

    _handleActionsChange(event) {
        const actions = event.detail.value;

        // Create update object, only including defined actions
        const updates = {};

        // Add actions that are actually configured
        if (actions.tap_action) {
            updates.tap_action = actions.tap_action;
        }
        if (actions.hold_action) {
            updates.hold_action = actions.hold_action;
        }
        if (actions.double_tap_action) {
            updates.double_tap_action = actions.double_tap_action;
        }

        // Remove actions that are no longer in the actions object
        // by explicitly setting them to undefined in the new config
        const newConfig = { ...this.config, ...updates };

        if (!actions.tap_action && this.config.tap_action) {
            delete newConfig.tap_action;
        }
        if (!actions.hold_action && this.config.hold_action) {
            delete newConfig.hold_action;
        }
        if (!actions.double_tap_action && this.config.double_tap_action) {
            delete newConfig.double_tap_action;
        }

        // Update entire config with cleaned version
        this.config = newConfig;
        this._validateConfig();
        this._yamlValue = configToYaml(this.config);

        // Fire config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
