/**
 * LCARdS Button Editor
 *
 * Visual editor for LCARdS Button card using declarative configuration.
 * Simplified from 617 lines to ~150 lines using the base editor's _renderFromConfig() method.
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';
import { configToYaml } from '../utils/yaml-utils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../components/shared/lcards-message.js';
import '../components/yaml/lcards-yaml-editor.js';
// Import shared form components
import '../components/shared/lcards-form-section.js';
// Import specialized editor components
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/editors/lcards-multi-text-editor-v2.js';
import '../components/editors/lcards-icon-editor.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-unified-segment-editor.js';
import '../components/editors/lcards-multi-action-editor.js';
// Import animation and filter components
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
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
        this._cardElement = null;
    }

    static get styles() {
        return [super.styles, editorComponentStyles];
    }

    /**
     * Called after first render - reliable initialization point
     * @override
     */
    firstUpdated() {
        super.firstUpdated?.();
        this._tryFindCardElement();
    }

    /**
     * Try to find card element with retries
     * @private
     */
    _tryFindCardElement() {
        let attempts = 0;
        const maxAttempts = 10;

        const tryFind = () => {
            attempts++;
            this._findCardElement();

            if (!this._cardElement && attempts < maxAttempts) {
                requestAnimationFrame(tryFind);
            }
        };

        requestAnimationFrame(tryFind);
    }

    /**
     * Find the card preview element in DOM using sibling-aware traversal
     *
     * DOM Structure in HA editor:
     * hui-dialog-edit-card
     *   ├─ .element-editor (contains THIS editor)
     *   └─ .element-preview (contains card preview) ← SIBLING not descendant!
     *
     * @private
     */
    _findCardElement() {
        const cardType = `lcards-${this.cardType}`;

        // Check if already found and still valid
        if (this._cardElement?.isConnected) {
            return;
        }

        let card = null;

        // UPDATED STRATEGY: Based on actual DOM structure
        // Editor path: hui-dialog-edit-card > ha-dialog (shadow) > .content > .element-editor >
        //              hui-card-element-editor (shadow) > .wrapper > .gui-editor > lcards-button-editor
        // Preview path: hui-dialog-edit-card > ha-dialog (shadow) > .content > .element-preview >
        //               hui-section > hui-grid-section (shadow) > ... > lcards-button

        // Step 1: Find wrapper and cross shadow boundary
        const wrapper = this.closest('.wrapper');
        if (wrapper) {
            // Step 2: Cross shadow boundary to get to hui-card-element-editor
            const shadowRoot = wrapper.getRootNode();
            if (shadowRoot && shadowRoot !== document) {
                const shadowHost = shadowRoot.host;

                if (shadowHost) {
                    // Step 3: Navigate to .element-editor parent
                    const editorContainer = shadowHost.parentElement;
                    if (editorContainer) {
                        // Step 4: Navigate to .content (common parent of editor and preview)
                        const content = editorContainer.parentElement;
                        if (content) {
                            // Step 5: Find .element-preview sibling
                            const preview = content.querySelector('.element-preview');
                            if (preview) {

                                // Step 6: Search for card within preview (must traverse shadow DOMs)
                                const searchInShadows = (root, depth = 0) => {
                                    if (depth > 5) return null;
                                    const found = root.querySelector(cardType);
                                    if (found) return found;

                                    const elements = root.querySelectorAll('*');
                                    for (const el of elements) {
                                        if (el.shadowRoot) {
                                            const inShadow = searchInShadows(el.shadowRoot, depth + 1);
                                            if (inShadow) return inShadow;
                                        }
                                    }
                                    return null;
                                };

                                // First try direct search, then shadow DOM traversal
                                card = preview.querySelector(cardType);
                                if (!card) {
                                    card = searchInShadows(preview);
                                }

                                if (!card) {
                                    lcardsLog.warn('[ButtonEditor] Card preview not found in .element-preview');
                                }
                            } else {
                                lcardsLog.warn('[ButtonEditor] .element-preview not found in editor dialog');
                            }
                        }
                    }
                }
            }
        }

        // FALLBACK: Global search
        if (!card) {
            card = document.querySelector(cardType);
            if (!card) {
                // Try in all shadow roots as last resort
                const allElements = document.querySelectorAll('*');
                for (const el of allElements) {
                    if (el.shadowRoot) {
                        card = el.shadowRoot.querySelector(cardType);
                        if (card) break;
                    }
                }
            }
        }

        // Store result
        if (card && card !== this._cardElement) {
            this._cardElement = card;
            this.requestUpdate();
        }
    }

    /**
     * Get list of entity attributes for dropdown
     * @returns {Array<string>} List of attribute names
     * @private
     */
    _getAttributeOptions() {
        const entityId = this.config?.entity;
        if (!entityId || !this.hass?.states?.[entityId]) {
            return [];
        }

        const entity = this.hass.states[entityId];
        const attributes = Object.keys(entity.attributes || {});
        return attributes.sort();
    }

    /**
     * Render attribute selector dropdown
     * @returns {TemplateResult}
     * @private
     */
    _renderAttributeSelector() {
        const attributes = this._getAttributeOptions();
        const currentAttribute = this.config?.control?.attribute || '';
        const entityId = this.config?.entity;

        // Check if current attribute is valid
        const isInvalidAttribute = currentAttribute &&
            entityId &&
            this.hass?.states?.[entityId] &&
            !this.hass.states[entityId].attributes?.hasOwnProperty(currentAttribute);

        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Attribute'}
                .value=${currentAttribute}
                .helper=${'Select an entity attribute to control (leave blank to control entity state)'}
                .disabled=${!entityId || attributes.length === 0}
                .selector=${{
                    select: {
                        custom_value: true,
                        mode: 'dropdown',
                        options: attributes.map(attr => ({ value: attr, label: attr }))
                    }
                }}
                @value-changed=${this._handleAttributeChange}>
            </ha-selector>
            ${isInvalidAttribute ? html`
                <lcards-message
                    type="warning"
                    message="The specified attribute '${currentAttribute}' does not exist on this entity. The button will control entity state instead.">
                </lcards-message>
            ` : ''}
        `;
    }

    /**
     * Handle attribute selection change
     * @param {CustomEvent} e
     * @private
     */
    _handleAttributeChange(e) {
        const value = e.detail.value;
        if (value) {
            this._setConfigValue('control.attribute', value);
        } else {
            this._removeConfigPath('control.attribute');
        }
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

        // Effects tab is relevant for all modes
        tabs.push({ label: 'Effects', content: () => this._renderEffectsTab() });

        return [...tabs, ...this._getUtilityTabs()];
    }

    /**
     * Config tab - Mode selection and basic settings
     * @returns {Array} Config tab definition
     * @private
     */
    _getConfigTabConfig() {
        const mode = this._getMode();

        const baseConfig = this._buildConfigTab({
            infoMessage: 'Configure the basic settings for your LCARdS button card. Select an entity to control or leave blank for a static button.',
            showBasicSection: false, // We'll add custom entity section below
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
        });

        // Add custom entity section with attribute selector
        // Insert at position 1 (after info message, before mode sections)
        baseConfig.splice(1, 0, {
            type: 'section',
            header: 'Entity Configuration',
            description: 'Entity to control and attributes',
            icon: 'mdi:home-automation',
            expanded: true,
            outlined: true,
            children: [
                {
                    type: 'custom',
                    render: () => html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Entity'}
                            .value=${this.config?.entity || ''}
                            .selector=${{ entity: {} }}
                            @value-changed=${(e) => {
                                const value = e.detail.value;
                                if (value) {
                                    this._setConfigValue('entity', value);
                                } else {
                                    this._removeConfigPath('entity');
                                }
                            }}>
                        </ha-selector>
                    `
                },
                {
                    type: 'custom',
                    render: () => this._renderAttributeSelector()
                }
            ]
        });

        // Add basic configuration section (ID and tags)
        baseConfig.push({
            type: 'section',
            header: 'Basic Configuration',
            description: 'Card identification and tagging',
            icon: 'mdi:tag',
            expanded: false,
            outlined: true,
            children: [
                { type: 'field', path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                { type: 'field', path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
            ]
        });

        return baseConfig;
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
                            <lcards-color-section-v2
                                .editor=${this}
                                basePath="style.card.color.background"
                                header="Background Colors"
                                description="Card background color for each state - supports custom states like 'idle', 'buffering', etc."
                                .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                                ?allowCustomStates=${true}
                                ?expanded=${false}>
                            </lcards-color-section-v2>
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
     * Text tab - uses enhanced component
     */
    _renderTextTab() {
        // CRITICAL: Use this.config?.text to ensure Lit reactivity when config changes
        const textConfig = this.config?.text || {};
        return html`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${textConfig}
                .hass=${this.hass}
                @text-changed=${(e) => {
                    // CRITICAL: Replace entire text object, don't merge (deepMerge won't delete fields)
                    this.config = { ...this.config, text: e.detail.value };
                    this._updateConfig(this.config, 'visual');
                }}>
            </lcards-multi-text-editor-v2>
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
                lcardsLog.error('❌ [LCARdS Button Editor] SVG parse error:', this._svgParseError);
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
            lcardsLog.error('❌ [LCARdS Button Editor] SVG parse exception:', error);
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

    /**
     * Render Effects tab - Animations + Filters combined
     * @returns {TemplateResult}
     * @private
     */
    _renderEffectsTab() {
        return html`
            <div class="tab-content-container">
                <!-- Card-Level Effects Info -->
                <lcards-message type="info">
                    <strong>Card-Level Effects:</strong>
                    <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                        This tab configures effects for the <strong>entire card</strong>. Animations here trigger on any card interaction.
                        <br/>• For <strong>per-segment animations</strong> (e.g., animate only the "up" button), use the <strong>Segments tab</strong> instead
                        <br/>• Card-level animations can target specific segments using the "targets" selector
                    </p>
                </lcards-message>

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations"
                    description="Trigger visual animations on user interactions or entity state changes"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this.config.animations || []}
                        .cardElement=${this._cardElement}
                        @animations-changed=${(e) => {
                            this._updateConfig({ animations: e.detail.value });
                        }}>
                    </lcards-animation-editor>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters"
                    description="Apply visual filters to the entire button (CSS and SVG filter primitives)"
                    icon="mdi:auto-fix"
                    ?expanded=${true}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${this.config.filters || []}
                        @filters-changed=${(e) => {
                            this._updateConfig({ filters: e.detail.value });
                        }}>
                    </lcards-filter-editor>
                </lcards-form-section>

            </div>
        `;
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
