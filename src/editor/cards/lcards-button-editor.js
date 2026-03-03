/**
 * LCARdS Button Editor
 *
 * Visual editor for LCARdS Button card using declarative configuration.
 * Simplified from 617 lines to ~150 lines using the base editor's _renderFromConfig() method.
 */

import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';
import { configToYaml } from '../utils/yaml-utils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { getComponentNames, getComponentsForCard } from '../../core/packs/components/index.js';
import '../components/shared/lcards-message.js';
import '../components/yaml/lcards-yaml-editor.js';
// Import shared form components
import '../components/shared/lcards-form-section.js';
// Import specialized editor components
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/shared/lcards-color-picker.js';
import '../components/editors/lcards-multi-text-editor-v2.js';
import '../components/editors/lcards-icon-editor.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-unified-segment-editor.js';
import '../components/editors/lcards-multi-action-editor.js';
// Import animation and filter components
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
import '../components/lcards-background-animation-editor.js';
import '../components/lcards-shape-texture-editor.js';
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

    /**
     * Build dropdown options for the button preset selector.
     * Queries StylePresetManager so third-party pack presets appear automatically.
     * Labels are derived from the preset key (e.g. 'bar-label-left' → 'Bar Label Left').
     *
     * @returns {Array<{value: string, label: string}>}
     * @private
     */
    _getButtonPresetOptions() {
        const spm = window.lcards?.core?.stylePresetManager;
        if (!spm) return [];
        return spm.getAvailablePresets('button').map(name => ({
            value: name,
            label: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        }));
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
     * Reconstruct the full animation list for the editor display.
     *
     * Merges component animation defaults (_componentAnimations from the card)
     * with the user's raw overrides (this.config.animations).  This avoids
     * depending on _cardElement.config which is a shared mutable object and
     * can lag behind after deepMerge in _updateConfig.
     *
     * @returns {Array}
     * @private
     */
    get _effectiveAnimations() {
        const componentAnims = this._cardElement?._componentAnimations || [];
        const userAnims = this.config.animations || [];
        const systemIds = new Set(componentAnims.map(a => a.id).filter(Boolean));

        // Start from component defaults, apply user overrides
        const result = componentAnims.map(compAnim => {
            const userOverride = userAnims.find(u => u.id === compAnim.id);
            if (!userOverride) return { ...compAnim };
            const merged = { ...compAnim };
            if (userOverride.enabled === false) merged.enabled = false;
            else delete merged.enabled;
            if (userOverride.trigger !== undefined) merged.trigger = userOverride.trigger;
            if (userOverride.params) merged.params = { ...compAnim.params, ...userOverride.params };
            return merged;
        });

        // Append user-defined animations (those without a system ID)
        for (const anim of userAnims) {
            if (!anim.id || !systemIds.has(anim.id)) {
                result.push({ ...anim });
            }
        }

        return result;
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
     * Build ha-selector option list for the ranges_attribute dropdown.
     * Injects the virtual "brightness_pct" option after "brightness" (if present)
     * and labels it clearly so users know it's the 0-100 computed value.
     * @returns {Array<{value:string, label:string}>}
     * @private
     */
    _getRangesAttributeOptions() {
        const entityId = this.config?.entity;
        const options = [{ value: '', label: '(Entity state)' }];
        if (!entityId || !this.hass?.states?.[entityId]) return options;

        const attrs = Object.keys(this.hass.states[entityId].attributes || {}).sort();
        for (const attr of attrs) {
            options.push({ value: attr, label: attr });
            // Inject virtual brightness_pct right after brightness
            if (attr === 'brightness') {
                options.push({ value: 'brightness_pct', label: 'brightness_pct  (auto 0–100%)' });
            }
        }
        return options;
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
     * Render a preset dropdown populated from the active component's preset list.
     * Reads available presets via ComponentManager so the options are always in sync
     * with the component definition — no hardcoded lists.
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentPresetSelector() {
        const componentType = this.config?.component;
        if (!componentType) return html``;

        const componentDef = window.lcards?.core?.getComponentManager?.()?.getComponent?.(componentType);
        const builtInNames = componentDef?.getPresetNames?.() || [];

        // Merge in user custom presets so they appear in the selector immediately
        const customPresetNames = Object.keys(this.config?.[componentType]?.custom_presets || {});
        const allPresetNames = [...builtInNames];
        for (const name of customPresetNames) {
            if (!allPresetNames.includes(name)) allPresetNames.push(name);
        }

        if (allPresetNames.length === 0) return html``;

        const options = allPresetNames.map(name => ({
            value: name,
            label: name
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
        }));

        const currentPreset = this.config?.preset || 'default';

        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Component Preset'}
                .helper=${`Choose the condition/state preset for this ${componentType} component`}
                .selector=${{ select: { mode: 'dropdown', options } }}
                .value=${currentPreset}
                @value-changed=${(e) => this._setConfigValue('preset', e.detail.value)}>
            </ha-selector>
        `;
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

        // Show Segments tab for component (dpad) and svg modes
        if (mode === 'component' || mode === 'svg') {
            tabs.push({ label: 'Segments', content: () => this._renderSegmentsTab() });
        }

        // Text tab is also available in component mode (for component text overlay fields)
        if (mode === 'component') {
            tabs.push(
                { label: 'Text', content: () => this._renderTextTab() }
            );
        }

        // Show Actions tab only in preset mode (component/svg have per-segment actions)
        if (mode === 'preset') {
            tabs.push({ label: 'Actions', content: () => this._renderActionsTab() });
        }

        // Effects tab is relevant for all modes
        tabs.push({ label: 'Effects', content: () => this._renderEffectsTab() });

        // Sound tab: per-card mute + event overrides
        tabs.push({ label: 'Sound', content: () => this._renderSoundTab() });

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
                            {
                                type: 'custom',
                                render: () => keyed(mode, html`
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{ select: { mode: 'dropdown', options: this._getButtonPresetOptions() } }}
                                        .value=${this.config.preset || 'lozenge'}
                                        .label=${'Preset Style'}
                                        @value-changed=${(e) => this._setConfigValue('preset', e.detail.value)}>
                                    </ha-selector>
                                `)
                            }
                        ] : []),
                        ...(mode === 'component' ? [
                            {
                                type: 'custom',
                                render: () => keyed(mode, html`
                                    <ha-selector
                                        .hass=${this.hass}
                                        .selector=${{ select: { mode: 'dropdown', options: getComponentsForCard('button').map(n => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) })) } }}
                                        .value=${this.config.component || 'dpad'}
                                        .label=${'Component Type'}
                                        @value-changed=${(e) => this._handleComponentTypeChange(e.detail.value)}>
                                    </ha-selector>
                                `)
                            },
                            {
                                type: 'custom',
                                render: () => this._renderComponentPresetSelector()
                            },
                            {
                                type: 'custom',
                                render: () => html`
                                    <lcards-message
                                        type="info"
                                        message="Use the Segments tab to colour the component segments. Use the Text tab to override label content.">
                                    </lcards-message>
                                `
                            }
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
                render: () => this._renderShapeTextureSection()
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
     * Render the shape texture section for Card & Border tab.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeTextureSection() {
        return html`
            <lcards-form-section
                header="Shape Texture"
                description="Apply an SVG texture or animation pattern inside the button shape"
                icon="mdi:texture"
                ?expanded=${!!this.config?.shape_texture?.preset}
                ?outlined=${true}>
                <lcards-shape-texture-editor
                    .hass=${this.hass}
                    .config=${this.config?.shape_texture ?? null}
                    @texture-changed=${(e) => {
                        if (e.detail.value) {
                            this._setConfigValue('shape_texture', e.detail.value);
                        } else {
                            this._removeConfigPath('shape_texture');
                        }
                    }}>
                </lcards-shape-texture-editor>
            </lcards-form-section>
        `;
    }

    /**
     * Text tab - uses enhanced component
     */
    _renderTextTab() {
        // CRITICAL: Use this.config?.text to ensure Lit reactivity when config changes
        const textConfig = this.config?.text || {};

        // Resolve component text areas so the editor can show area selectors and
        // font_size_percent fields when this card uses a component with named text areas.
        // Always provide arrays (possibly empty) to satisfy downstream prop types.
        let componentTextAreas = [];
        let componentTextFields = [];
        if (this.config?.component) {
            const componentDef = window.lcards?.core?.getComponentManager?.()?.getComponent?.(this.config.component);
            componentTextAreas  = componentDef?.text_areas || [];
            // Preset field names (excluding 'default') so the editor can offer them as
            // one-click "add" suggestions styled differently from generic quick-add fields.
            const allComponentFields = Object.keys(componentDef?.text || {}).filter(k => k !== 'default');
            componentTextFields = allComponentFields.length > 0 ? allComponentFields : [];
        }

        return html`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${textConfig}
                .hass=${this.hass}
                .componentTextAreas=${componentTextAreas}
                .componentTextFields=${componentTextFields}
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
            // Component mode: predefined segments from component definition
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
                    ${this._renderRangesConfig()}
                `;
            }

            if (componentType === 'alert') {
                return html`
                    <lcards-message
                        type="info"
                        message="Override the default segment colours for the alert shape and bars. Text labels are configured in the Text tab.">
                    </lcards-message>
                    ${this._renderAlertColorSection()}
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        componentType="alert"
                        .segments=${this.config.alert?.segments || {}}
                        .predefinedSegmentIds=${['shape', 'bars']}
                        ?showDefaults=${false}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                    ${this._renderCustomPresetsSection()}
                    ${this._renderRangesConfig()}
                `;
            }

            // Generic fallback: try to read segment IDs from the component definition
            const componentDef = window.lcards?.core?.getComponentManager?.()?.getComponent?.(componentType);
            const segmentIds = componentDef ? Object.keys(componentDef.segments || {}) : [];

            if (segmentIds.length > 0) {
                return html`
                    <lcards-unified-segment-editor
                        .editor=${this}
                        mode="dpad"
                        componentType=${componentType}
                        .segments=${this.config[componentType]?.segments || {}}
                        .predefinedSegmentIds=${segmentIds}
                        ?showDefaults=${false}
                        .hass=${this.hass}>
                    </lcards-unified-segment-editor>
                    ${this._renderRangesConfig()}
                `;
            }

            // No segment definition available yet
            return html`
                <lcards-message
                    type="info"
                    message="Segment editor for '${componentType}' is not yet available.">
                </lcards-message>
                ${this._renderRangesConfig()}
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

    /**
     * Handle component type change (e.g. dpad → alert).
     * Clears all known component config keys so stale data from the old
     * component (segments, text overrides, preset, custom_presets) doesn't
     * pollute the new one.
     * @param {string} newComponent
     * @private
     */
    _handleComponentTypeChange(newComponent) {
        if (!newComponent || newComponent === this.config.component) return;

        const oldComponent = this.config.component;
        const newConfig = { ...this.config };

        // Remove old component's data key (e.g. config.dpad, config.alert)
        if (oldComponent) delete newConfig[oldComponent];

        // Also clear any other known component keys that might be stale
        for (const name of getComponentNames()) {
            if (name !== newComponent) delete newConfig[name];
        }

        // Clear fields that are component-specific
        delete newConfig.text;
        delete newConfig.preset;
        delete newConfig.animations;

        // Set new component and seed its data key as an empty object
        newConfig.component = newComponent;
        newConfig[newComponent] = { segments: {} };

        const oldConfig = this.config;
        this.config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
        this.requestUpdate('config', oldConfig);

        lcardsLog.debug(`[LCARdSButtonEditor] Component type changed: ${oldComponent} → ${newComponent}`);
    }

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
            validKeys = ['component', 'dpad', 'alert', 'preset', 'text', 'entity'];
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

    // ─────────────────────────────────────────────────────────────────────────
    // Ranges: state-driven preset switching
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Render the "State-Driven Presets (Ranges)" section for component mode.
     * Allows the user to map entity-state value ranges to named component presets.
     * @returns {TemplateResult}
     * @private
     */
    _renderRangesConfig() {
        const componentType = this.config?.component;
        const hasEntity = !!this.config?.entity;

        // Collect available preset names from the component definition
        const componentDef = window.lcards?.core?.getComponentManager?.()?.getComponent?.(componentType);
        const presetNames = componentDef?.getPresetNames?.() || [];
        // Also include any user-defined custom presets
        const customPresetNames = Object.keys(this.config?.[componentType]?.custom_presets || {});
        const allPresetNames = [...presetNames];
        for (const name of customPresetNames) {
            if (!allPresetNames.includes(name)) allPresetNames.push(name);
        }
        const presetOptions = allPresetNames.map(name => ({
            value: name,
            label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        }));

        const ranges = this.config?.ranges || [];

        const sectionStyle = 'display: flex; flex-direction: column; gap: 8px; margin: 12px 0 4px;';
        const emptyStyle = 'text-align: center; padding: 24px 16px; color: var(--secondary-text-color);';

        return html`
            <lcards-form-section
                header="State-Driven Presets (Ranges)"
                description="Auto-switch the component preset based on entity state value"
                icon="mdi:tune-variant"
                ?expanded=${ranges.length > 0}
                ?outlined=${true}>

                ${!hasEntity ? html`
                    <lcards-message type="info"
                        message="Select an entity above to enable state-driven preset switching.">
                    </lcards-message>
                ` : html`
                    <lcards-message type="info">
                        Ranges are evaluated top-to-bottom — the first match wins.
                        Each row maps a value condition to a component preset.
                    </lcards-message>

                    <ha-selector
                        style="margin-bottom: 4px;"
                        .hass=${this.hass}
                        .label=${'Attribute'}
                        .helper=${'Entity attribute to compare against the thresholds. Leave as (Entity state) to use the entity state value directly.'}
                        .selector=${{ select: {
                            mode: 'dropdown',
                            options: this._getRangesAttributeOptions(),
                            custom_value: true
                        }}}
                        .value=${this.config?.ranges_attribute || ''}
                        @value-changed=${(e) => {
                            let v = (e.detail.value ?? '').trim();
                            // Auto-convert: selecting the raw 'brightness' attribute
                            // is almost never what the user wants — swap to the
                            // virtual brightness_pct so ranges use a 0-100 scale.
                            if (v === 'brightness') v = 'brightness_pct';
                            if (v) this._setConfigValue('ranges_attribute', v);
                            else   this._removeConfigPath('ranges_attribute');
                        }}>
                    </ha-selector>

                    <div style="${sectionStyle}">
                        ${ranges.length === 0 ? html`
                            <div style="${emptyStyle}">
                                <div style="font-weight: 600; margin-bottom: 4px;">No ranges defined</div>
                                <div style="font-size: 12px;">Add a range to switch presets based on entity state</div>
                            </div>
                        ` : ranges.map((range, idx) => this._renderRangeRow(range, idx, presetOptions))}
                    </div>

                    <ha-button @click=${() => this._addPresetRange()}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Range
                    </ha-button>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Render a single range row (inline grid layout).
     * @param {Object} range - Range entry { preset, above?, below?, equals? }
     * @param {number} idx   - Array index
     * @param {Array}  presetOptions - [{value, label}] for the preset dropdown
     * @returns {TemplateResult}
     * @private
     */
    _renderRangeRow(range, idx, presetOptions) {
        // Determine current condition type
        const condType = range.equals !== undefined      ? 'equals'
                       : (range.above !== undefined &&
                          range.below !== undefined)     ? 'between'
                       : range.above !== undefined       ? 'above'
                       : range.below !== undefined       ? 'below'
                       : 'above';

        const condOptions = [
            { value: 'above',   label: '≥ Above (or equal)' },
            { value: 'below',   label: '< Below' },
            { value: 'between', label: '↔ Between' },
            { value: 'equals',  label: '= Equals (string)' }
        ];

        const cardStyle = [
            'display: flex; flex-direction: column; gap: 10px;',
            'padding: 12px;',
            'background: var(--secondary-background-color);',
            'border-radius: 8px;',
            'border: 1px solid var(--divider-color);'
        ].join(' ');

        // Row 1: Preset (fills remaining space) + Delete (icon, right-aligned)
        const row1Style = 'display: flex; align-items: flex-end; gap: 8px;';
        // Row 2: Condition + Value(s) — equal split
        const row2Style = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: end;';
        // Row 2 when "between": Condition + From + To — thirds
        const row2BetweenStyle = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: end;';

        return html`
            <div style="${cardStyle}">

                <!-- Row 1: Preset + Delete -->
                <div style="${row1Style}">
                    <div style="flex: 1;">
                        ${presetOptions.length > 0 ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Preset'}
                                .selector=${{ select: { mode: 'dropdown', options: presetOptions } }}
                                .value=${range.preset || ''}
                                @value-changed=${(e) => this._updateRangeField(idx, 'preset', e.detail.value)}>
                            </ha-selector>
                        ` : html`
                            <ha-textfield
                                style="width: 100%;"
                                .label=${'Preset name'}
                                .value=${range.preset || ''}
                                @change=${(e) => this._updateRangeField(idx, 'preset', e.target.value)}>
                            </ha-textfield>
                        `}
                    </div>
                    <ha-icon-button
                        .label=${'Remove range'}
                        .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                        @click=${() => this._deletePresetRange(idx)}>
                    </ha-icon-button>
                </div>

                <!-- Row 2: Condition + Value(s) -->
                <div style="${condType === 'between' ? row2BetweenStyle : row2Style}">

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'When'}
                        .selector=${{ select: { mode: 'dropdown', options: condOptions } }}
                        .value=${condType}
                        @value-changed=${(e) => this._updateRangeCondition(idx, e.detail.value, range)}>
                    </ha-selector>

                    ${condType === 'between' ? html`
                        <ha-textfield
                            .label=${'From (≥)'}
                            type="number"
                            .value=${String(range.above ?? '')}
                            @change=${(e) => this._updateRangeField(idx, 'above', parseFloat(e.target.value))}>
                        </ha-textfield>
                        <ha-textfield
                            .label=${'To (<)'}
                            type="number"
                            .value=${String(range.below ?? '')}
                            @change=${(e) => this._updateRangeField(idx, 'below', parseFloat(e.target.value))}>
                        </ha-textfield>
                    ` : condType === 'equals' ? html`
                        <ha-textfield
                            .label=${'Value'}
                            .value=${String(range.equals ?? '')}
                            @change=${(e) => this._updateRangeField(idx, 'equals', e.target.value)}>
                        </ha-textfield>
                    ` : html`
                        <ha-textfield
                            .label=${condType === 'above' ? 'Min (≥)' : 'Max (<)'}
                            type="number"
                            .value=${String(condType === 'above' ? (range.above ?? '') : (range.below ?? ''))}
                            @change=${(e) => this._updateRangeField(
                                idx,
                                condType === 'above' ? 'above' : 'below',
                                parseFloat(e.target.value)
                            )}>
                        </ha-textfield>
                    `}
                </div>

                ${this.config?.component === 'alert' ? html`
                    <!-- Row 3: Per-range color overrides (alert component only) -->
                    <details style="margin-top: 4px;" ?open=${!!(range.color?.shape || range.color?.bars)}>
                        <summary style="cursor: pointer; font-size: 12px; color: var(--secondary-text-color); user-select: none; padding: 4px 0; list-style: none; display: flex; align-items: center; gap: 6px;">
                            <ha-icon icon="mdi:palette" style="--mdc-icon-size: 14px; opacity: 0.7;"></ha-icon>
                            Color override
                            ${(range.color?.shape || range.color?.bars) ? html`<span style="color: var(--primary-color); font-size: 11px; font-weight: 600;">(active)</span>` : ''}
                        </summary>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                            <!-- Shape picker card -->
                            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                                <div style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--secondary-background-color);">
                                    <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 15px; flex-shrink: 0;"></ha-icon>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                                </div>
                                <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                    <lcards-color-picker
                                        .hass=${this.hass}
                                        .value=${range.color?.shape || ''}
                                        ?showPreview=${true}
                                        ?allowMatchLight=${this._isLightEntity}
                                        .entityId=${this.config?.entity || ''}
                                        @value-changed=${(e) => this._updateRangeColor(idx, 'shape', e.detail.value)}>
                                    </lcards-color-picker>
                                </div>
                            </div>
                            <!-- Bars picker card -->
                            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                                <div style="display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: var(--secondary-background-color);">
                                    <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 15px; flex-shrink: 0;"></ha-icon>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                                </div>
                                <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                    <lcards-color-picker
                                        .hass=${this.hass}
                                        .value=${range.color?.bars || ''}
                                        ?showPreview=${true}
                                        ?allowMatchLight=${this._isLightEntity}
                                        .entityId=${this.config?.entity || ''}
                                        @value-changed=${(e) => this._updateRangeColor(idx, 'bars', e.detail.value)}>
                                    </lcards-color-picker>
                                </div>
                            </div>
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    }

    // ─── Alert Color Shorthand ────────────────────────────────────────────────

    /**
     * Render the alert-level colour shorthand section (alert.color.shape / alert.color.bars).
     * These are the top-priority overrides that sit above the active preset.
     */
    _renderAlertColorSection() {
        const shapeVal = this.config?.alert?.color?.shape || '';
        const barsVal  = this.config?.alert?.color?.bars  || '';
        const hasColor = !!(shapeVal || barsVal);

        return html`
            <lcards-form-section
                header="Alert Colors"
                description="Override preset colors for the shield shape and animated bars."
                icon="mdi:palette"
                ?expanded=${hasColor}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message type="info"
                    message="These colors take highest priority — they override both the active preset and the segments settings below. Leave blank to inherit from the active preset.">
                </lcards-message>

                <div style="display: flex; flex-direction: column; gap: 8px; padding: 8px 0;">
                    <!-- Shape picker card -->
                    <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--secondary-background-color);">
                            <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;"></ha-icon>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                                <div style="font-size: 11px; color: var(--secondary-text-color);">Shield outline fill color</div>
                            </div>
                        </div>
                        <div style="padding: 12px 16px; background: var(--primary-background-color);">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${shapeVal}
                                ?showPreview=${true}
                                ?allowMatchLight=${this._isLightEntity}
                                .entityId=${this.config?.entity || ''}
                                @value-changed=${(e) => {
                                    if (e.detail.value) this._setConfigValue('alert.color.shape', e.detail.value);
                                    else this._removeConfigPath('alert.color.shape');
                                }}>
                            </lcards-color-picker>
                        </div>
                    </div>
                    <!-- Bars picker card -->
                    <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--secondary-background-color);">
                            <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;"></ha-icon>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                                <div style="font-size: 11px; color: var(--secondary-text-color);">Animated bar line color</div>
                            </div>
                        </div>
                        <div style="padding: 12px 16px; background: var(--primary-background-color);">
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${barsVal}
                                ?showPreview=${true}
                                ?allowMatchLight=${this._isLightEntity}
                                .entityId=${this.config?.entity || ''}
                                @value-changed=${(e) => {
                                    if (e.detail.value) this._setConfigValue('alert.color.bars', e.detail.value);
                                    else this._removeConfigPath('alert.color.bars');
                                }}>
                            </lcards-color-picker>
                        </div>
                    </div>
                </div>
            </lcards-form-section>
        `;
    }

    // ─── Custom Presets ───────────────────────────────────────────────────────

    /**
     * Render the Custom Presets section.  Users can define new alert presets or
     * override the colours of any built-in preset (condition_red, etc.).
     */
    _renderCustomPresetsSection() {
        const componentDef   = window.lcards?.core?.getComponentManager?.()?.getComponent?.('alert');
        const builtinNames   = componentDef?.getPresetNames?.() ?? [];
        const customPresets  = this.config?.alert?.custom_presets ?? {};
        const presetNames    = Object.keys(customPresets);

        return html`
            <lcards-form-section
                header="Custom Presets"
                description="Define new alert presets or override built-in preset colors."
                icon="mdi:palette-swatch"
                ?expanded=${presetNames.length > 0}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message type="info"
                    message="Use the same name as a built-in preset (e.g. condition_red) to override its colors, or use a new name to define your own preset.">
                </lcards-message>

                <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">
                    ${presetNames.map(name => this._renderCustomPresetRow(name, customPresets[name], builtinNames))}
                </div>

                <ha-button @click=${() => this._addCustomPreset()}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Custom Preset
                </ha-button>
            </lcards-form-section>
        `;
    }

    /** Render a single custom-preset row (collapsible). */
    _renderCustomPresetRow(name, presetData, builtinNames) {
        const isOverride = builtinNames.includes(name);
        const isExpanded = this._expandedCustomPresets?.[name] ?? false;
        const shapeVal   = presetData?.segments?.shape?.style?.fill   ?? '';
        const barsVal    = presetData?.segments?.bars?.style?.stroke  ?? '';
        const text1Val   = presetData?.text?.alert_text?.color ?? '';
        const text2Val   = presetData?.text?.sub_text?.color   ?? '';

        return html`
            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; transition: border-color 0.2s;">
                <!-- Row header -->
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; user-select: none; background: var(--secondary-background-color); transition: background 0.2s;"
                     @click=${() => this._toggleCustomPresetExpanded(name)}>
                    <ha-icon
                        icon=${isOverride ? 'mdi:palette-advanced' : 'mdi:palette-swatch-outline'}
                        style="color: var(--primary-color); --mdc-icon-size: 18px; flex-shrink: 0;">
                    </ha-icon>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                        <div style="font-size: 11px; color: var(--secondary-text-color);">
                            ${isOverride ? 'Overrides built-in preset' : 'Custom preset'}
                        </div>
                    </div>
                    <ha-icon-button
                        title="Delete"
                        style="--mdc-icon-button-size: 36px; --mdc-icon-size: 18px;"
                        @click=${(e) => { e.stopPropagation(); this._deleteCustomPreset(name); }}>
                        <ha-icon icon="mdi:delete-outline"></ha-icon>
                    </ha-icon-button>
                    <ha-icon
                        icon="mdi:chevron-down"
                        style="flex-shrink: 0; transition: transform 0.2s; ${isExpanded ? 'transform: rotate(180deg);' : ''}">
                    </ha-icon>
                </div>

                <!-- Expanded content -->
                ${isExpanded ? html`
                    <div style="padding: 12px 16px; background: var(--primary-background-color); border-top: 1px solid var(--divider-color); display: flex; flex-direction: column; gap: 10px;">
                        <!-- Rename field -->
                        <div>
                            <div style="font-size: 12px; font-weight: 500; margin-bottom: 6px; color: var(--primary-text-color);">Preset name</div>
                            <ha-textfield
                                style="width: 100%;"
                                .value=${name}
                                placeholder="e.g. condition_red or my_preset"
                                @change=${(e) => this._renameCustomPreset(name, e.target.value.trim())}>
                            </ha-textfield>
                            ${isOverride ? html`
                                <div style="font-size: 11px; color: var(--warning-color, orange); margin-top: 4px;">
                                    ⚠ Overrides built-in preset <strong>${name}</strong>
                                </div>
                            ` : ''}
                        </div>
                        <!-- Shape picker card -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:shield-outline" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Shape fill</div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${shapeVal}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${this.config?.entity || ''}
                                    @value-changed=${(e) => this._setCustomPresetColor(name, 'shape', e.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Bars picker card -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:view-sequential" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Bars stroke</div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${barsVal}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${this.config?.entity || ''}
                                    @value-changed=${(e) => this._setCustomPresetColor(name, 'bars', e.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Alert text color picker -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:format-color-text" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Label color</div>
                                    <div style="font-size: 11px; color: var(--secondary-text-color);">Main alert label (alert_text)</div>
                                </div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${text1Val}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${this.config?.entity || ''}
                                    @value-changed=${(e) => this._setCustomPresetTextColor(name, 'alert_text', e.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                        <!-- Sub text color picker -->
                        <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--secondary-background-color);">
                                <ha-icon icon="mdi:format-letter-case" style="color: var(--primary-color); --mdc-icon-size: 16px; flex-shrink: 0;"></ha-icon>
                                <div>
                                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-text-color);">Sub-label color</div>
                                    <div style="font-size: 11px; color: var(--secondary-text-color);">Secondary label (sub_text)</div>
                                </div>
                            </div>
                            <div style="padding: 10px 14px; background: var(--primary-background-color);">
                                <lcards-color-picker
                                    .hass=${this.hass}
                                    .value=${text2Val}
                                    ?showPreview=${true}
                                    ?allowMatchLight=${this._isLightEntity}
                                    .entityId=${this.config?.entity || ''}
                                    @value-changed=${(e) => this._setCustomPresetTextColor(name, 'sub_text', e.detail.value)}>
                                </lcards-color-picker>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    _toggleCustomPresetExpanded(name) {
        this._expandedCustomPresets = {
            ...(this._expandedCustomPresets ?? {}),
            [name]: !(this._expandedCustomPresets?.[name])
        };
        this.requestUpdate();
    }

    _addCustomPreset() {
        const name = `custom_preset_${Date.now()}`;
        // Write directly to the new key's path to avoid deepMerge touching other presets
        this._setConfigValue(`alert.custom_presets.${name}`, {
            segments: { shape: { style: {} }, bars: { style: {} } }
        });
        this._expandedCustomPresets = { ...(this._expandedCustomPresets ?? {}), [name]: true };
        this.requestUpdate();
    }

    _deleteCustomPreset(name) {
        const existing = { ...(this.config?.alert?.custom_presets ?? {}) };
        delete existing[name];
        if (Object.keys(existing).length === 0) this._removeConfigPath('alert.custom_presets');
        else this._setConfigValue('alert.custom_presets', existing);
    }

    _setCustomPresetColor(presetName, segment, value) {
        const path = segment === 'shape'
            ? `alert.custom_presets.${presetName}.segments.shape.style.fill`
            : `alert.custom_presets.${presetName}.segments.bars.style.stroke`;
        if (value) this._setConfigValue(path, value);
        else this._removeConfigPath(path);
    }

    /** Set text color for a specific text field (alert_text or sub_text) in a custom preset. */
    _setCustomPresetTextColor(presetName, field, value) {
        const newConfig = JSON.parse(JSON.stringify(this.config ?? {}));
        const preset = newConfig?.alert?.custom_presets?.[presetName];
        if (!preset) return;
        if (value) {
            preset.text = preset.text ?? {};
            preset.text[field] = { ...(preset.text[field] ?? {}), color: value };
        } else {
            if (preset.text?.[field]) {
                delete preset.text[field].color;
                if (!Object.keys(preset.text[field]).length) delete preset.text[field];
            }
            if (preset.text && !Object.keys(preset.text).length) delete preset.text;
        }
        const oldConfig = this.config;
        this.config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
        this.requestUpdate('config', oldConfig);
    }

    _renameCustomPreset(oldName, newName) {
        if (!newName || newName === oldName) return;
        const existing = this.config?.alert?.custom_presets ?? {};
        if (newName in existing) return; // name already taken — silently ignore

        // Build the renamed presets map, preserving key order
        const newPresets = Object.fromEntries(
            Object.entries(existing).map(([k, v]) => [k === oldName ? newName : k, v])
        );

        // Atomic single-update: clone config, swap in new presets, fire one config-changed
        const newConfig = JSON.parse(JSON.stringify(this.config ?? {}));
        if (!newConfig.alert) newConfig.alert = {};
        newConfig.alert.custom_presets = newPresets;
        const oldConfig = this.config;
        this.config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
        this.requestUpdate('config', oldConfig);

        // Keep the row expanded under the new name
        const expanded = { ...(this._expandedCustomPresets ?? {}) };
        expanded[newName] = expanded[oldName] ?? true;
        delete expanded[oldName];
        this._expandedCustomPresets = expanded;
        this.requestUpdate();
    }

    // ─── Range Helpers ────────────────────────────────────────────────────────

    /** Update the color override (shape or bars) on a specific range entry. */
    _updateRangeColor(idx, segment, value) {
        const ranges = [...(this.config?.ranges ?? [])];
        const entry  = { ...ranges[idx] };
        if (value) {
            entry.color = { ...(entry.color ?? {}), [segment]: value };
        } else {
            if (entry.color) {
                const c = { ...entry.color };
                delete c[segment];
                if (Object.keys(c).length === 0) delete entry.color;
                else entry.color = c;
            }
        }
        ranges[idx] = entry;
        this._setConfigValue('ranges', ranges);
    }

    /** Add a blank range entry. */
    _addPresetRange() {
        const ranges = this.config?.ranges || [];
        this._setConfigValue('ranges', [...ranges, { preset: '', above: 0 }]);
    }

    /** Delete a range entry by index. */
    _deletePresetRange(idx) {
        const ranges = (this.config?.ranges || []).filter((_, i) => i !== idx);
        if (ranges.length === 0) {
            this._removeConfigPath('ranges');
        } else {
            this._setConfigValue('ranges', ranges);
        }
    }

    /** Update a single field on a range entry. */
    _updateRangeField(idx, field, value) {
        const ranges = [...(this.config?.ranges || [])];
        ranges[idx] = { ...ranges[idx], [field]: value };
        this._setConfigValue('ranges', ranges);
    }

    /**
     * Switch the condition type on a range, keeping the preset and migrating
     * whatever numeric/string value was already present.
     */
    _updateRangeCondition(idx, newCondType, existingRange) {
        const ranges = [...(this.config?.ranges || [])];
        const { preset } = existingRange;
        let newRange = { preset };

        if (newCondType === 'above')   newRange.above = existingRange.above ?? 0;
        if (newCondType === 'below')   newRange.below = existingRange.below ?? 100;
        if (newCondType === 'between') {
            newRange.above = existingRange.above ?? 0;
            newRange.below = existingRange.below ?? 100;
        }
        if (newCondType === 'equals')  newRange.equals = existingRange.equals ?? '';

        ranges[idx] = newRange;
        this._setConfigValue('ranges', ranges);
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
                        .animations=${this._effectiveAnimations}
                        .cardElement=${this._cardElement}
                        .systemAnimationIds=${(this._cardElement?._componentAnimations || []).map(a => a.id).filter(Boolean)}
                        @animations-changed=${(e) => {
                            const newAnims = e.detail.value || [];
                            const componentAnims = this._cardElement?._componentAnimations || [];
                            const systemIds = new Set(componentAnims.map(a => a.id).filter(Boolean));
                            // For system animations, save only the delta (what differs from component defaults)
                            const toSave = newAnims
                                .map(anim => {
                                    if (!anim.id || !systemIds.has(anim.id)) return anim; // user-defined: save as-is
                                    const compDef = componentAnims.find(c => c.id === anim.id);
                                    const delta = { id: anim.id };
                                    if (anim.enabled === false) delta.enabled = false;
                                    if (anim.trigger !== (compDef?.trigger || 'on_load')) delta.trigger = anim.trigger;
                                    const diffParams = {};
                                    for (const [k, v] of Object.entries(anim.params || {})) {
                                        if (JSON.stringify(v) !== JSON.stringify(compDef?.params?.[k])) diffParams[k] = v;
                                    }
                                    if (Object.keys(diffParams).length > 0) delta.params = diffParams;
                                    return Object.keys(delta).length > 1 ? delta : null;
                                })
                                .filter(Boolean);
                            this._updateConfig({ animations: toSave.length > 0 ? toSave : undefined });
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

                <!-- Background Animation Section -->
                <lcards-form-section
                    header="Background Animation"
                    description="Animated canvas backgrounds (grids, hexagons, diagonals, etc.)"
                    icon="mdi:grid"
                    ?expanded=${true}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${this.config.background_animation ?? []}
                        @effects-changed=${(e) => {
                            this._updateConfig({ background_animation: e.detail.value });
                        }}>
                    </lcards-background-animation-editor>
                </lcards-form-section>

            </div>
        `;
    }
}

customElements.define('lcards-button-editor', LCARdSButtonEditor);
