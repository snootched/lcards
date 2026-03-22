/**
 * @fileoverview LCARdS Slider Editor
 *
 * Visual configuration editor for slider cards.
 * 5-tab structure with utility tabs from base class.
 *
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { deepMerge } from '../../utils/deepMerge.js';

// Import shared form components
import '../components/editors/lcards-color-section.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/editors/lcards-border-editor.js';
import '../components/editors/lcards-object-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/shared/lcards-message.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-color-picker.js';

// Import specialized editor components
import '../components/editors/lcards-multi-text-editor-v2.js';
import '../components/editors/lcards-multi-action-editor.js';
import '../components/editors/lcards-slider-range-visualizer.js';

// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';

// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';

// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';

// Import theme browser
import '../components/theme-browser/lcards-theme-token-browser-tab.js';

// Import provenance tab
import '../components/provenance/lcards-provenance-tab.js';

/**
 * Slider configuration state manager
 * Tracks component, preset, track type, and orientation
 * @private
 */
class SliderConfigState {
    constructor(config) {
        this.config = config;
    }

    // Component: Provides shell SVG (basic, picard, etc.)
    get component() {
        return this.config.component || 'basic';
    }

    // Preset: Provides style defaults (pills-basic, gauge-basic, etc.)
    get preset() {
        return this.config.preset || null;
    }

    // Track type: Visual rendering style (pills, gauge, or shaped)
    // Checks: explicit config → component name → preset name → default
    get trackType() {
        // 1. Explicit config wins
        if (this.config.style?.track?.type) {
            return this.config.style.track.type;
        }

        // 2. Shaped component always uses shaped fill mode
        const component = this.config.component || this.config.style?.component;
        if (component === 'shaped') {
            return 'shaped';
        }

        // 3. Infer from preset name (gauge-* = gauge, shaped-* = shaped, otherwise pills)
        if (this.preset) {
            if (this.preset.includes('gauge'))  return 'gauge';
            if (this.preset.includes('shaped')) return 'shaped';
            return 'pills';
        }

        // 4. Default to pills
        return 'pills';
    }

    // Orientation: Layout direction (horizontal or vertical)
    get orientation() {
        return this.config.style?.track?.orientation || 'horizontal';
    }

    /**
     * Get configuration source priority
     * @returns {'preset' | 'component' | 'manual'}
     */
    getConfigSource() {
        if (this.preset) return 'preset';
        if (this.component) return 'component';
        return 'manual';
    }
}

export class LCARdSSliderEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'slider';
        this._previousTrackType = null;
        this._expandedRanges = {}; // Track which ranges are expanded

        // Bind event handlers
        this._handleRangeChanged = this._handleRangeChanged.bind(this);
        this._handleDirectionChanged = this._handleDirectionChanged.bind(this);

        lcardsLog.debug('[LCARdSSliderEditor] Editor initialized with cardType: slider (5 tabs + utility tabs)');
    }

    /**
     * Handle range changes from visualizer
     * @private
     */
    _handleRangeChanged(event) {
        const updates = event.detail;
        const newConfig = { ...this.config };

        // Update control range
        if ('controlMin' in updates) {
            if (!newConfig.control) newConfig.control = {};
            newConfig.control.min = updates.controlMin;
        }
        if ('controlMax' in updates) {
            if (!newConfig.control) newConfig.control = {};
            newConfig.control.max = updates.controlMax;
        }

        // Update display range
        if ('displayMin' in updates) {
            if (!newConfig.style) newConfig.style = {};
            if (!newConfig.style.track) newConfig.style.track = {};
            if (!newConfig.style.track.display) newConfig.style.track.display = {};
            newConfig.style.track.display.min = updates.displayMin;
        }
        if ('displayMax' in updates) {
            if (!newConfig.style) newConfig.style = {};
            if (!newConfig.style.track) newConfig.style.track = {};
            if (!newConfig.style.track.display) newConfig.style.track.display = {};
            newConfig.style.track.display.max = updates.displayMax;
        }

        this._updateConfig(newConfig);
    }

    /**
     * Handle direction changes from visualizer
     * @private
     */
    _handleDirectionChanged(event) {
        const { orientation, invertFill, invertValue } = event.detail;
        const newConfig = { ...this.config };

        // Update orientation
        if (!newConfig.style) newConfig.style = {};
        if (!newConfig.style.track) newConfig.style.track = {};
        newConfig.style.track.orientation = orientation;
        newConfig.style.track.invert_fill = invertFill;

        // Update value inversion
        if (!newConfig.control) newConfig.control = {};
        newConfig.control.invert_value = invertValue;

        this._updateConfig(newConfig);
    }

    /**
     * Lit lifecycle - detect config changes and force re-render
     * @param {Map} changedProps
     */
    updated(changedProps) {
        super.updated(changedProps);

        lcardsLog.debug('[LCARdSSliderEditor] updated() called', {
            hasConfig: changedProps.has('config'),
            changedKeys: Array.from(changedProps.keys()),
            preset: this.config?.preset
        });

        // Check if track type changed (from preset or manual config)
        if (changedProps.has('config')) {
            const state = this._getSliderState();
            const currentTrackType = state.trackType;

            lcardsLog.debug('[LCARdSSliderEditor] Config changed, checking track type', {
                previousTrackType: this._previousTrackType,
                currentTrackType: currentTrackType,
                preset: this.config?.preset,
                trackTypeInConfig: this.config?.style?.track?.type
            });

            if (this._previousTrackType !== currentTrackType) {
                lcardsLog.info('[LCARdSSliderEditor] Track type changed - forcing re-render', {
                    from: this._previousTrackType,
                    to: currentTrackType,
                    preset: this.config?.preset
                });
                this._previousTrackType = currentTrackType;
                // Force re-render of tabs
                this.requestUpdate();
            }
        }
    }

    /**
     * Get slider configuration state manager
     * @returns {SliderConfigState}
     * @private
     */
    _getSliderState() {
        return new SliderConfigState(this.config);
    }

    /**
     * Get component metadata from ComponentManager
     * @param {string} componentName - Component name (e.g., 'picard')
     * @returns {Object|null} Component metadata or null
     * @private
     */
    _getComponentMetadata(componentName) {
        if (!componentName) return null;

        const componentManager = window.lcards?.core?.getComponentManager?.();
        if (!componentManager) {
            lcardsLog.warn('[LCARdSSliderEditor] ComponentManager not available');
            return null;
        }

        return componentManager.getComponentMetadata(componentName);
    }

    /**
    /**
     * Render orientation selector with component metadata filtering
     * @returns {TemplateResult}
     * @private
     */
    _renderOrientationSelector() {
        const componentName = this.config?.component;
        const metadata = this._getComponentMetadata(componentName);

        // If component has fixed orientation, show it as disabled text
        if (metadata?.orientation && metadata.orientation !== 'auto') {
            const orientationLabel = metadata.orientation.charAt(0).toUpperCase() +
                                   metadata.orientation.slice(1);

            return html`
                <ha-textfield
                    .label=${'Orientation'}
                    .value=${`${orientationLabel} (fixed)`}
                    .disabled=${true}
                    .helper=${'This component only supports ${metadata.orientation} orientation'}
                ></ha-textfield>
            `;
        }

        // Show full orientation selector
        return FormField.renderField(this, 'style.track.orientation', {
            label: 'Orientation',
            // @ts-ignore - TS2353: auto-suppressed
            type: 'select',
            options: [
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' }
            ]
        });
    }

    /**
     * Render preset selector filtered by the currently selected component.
     *
     * Uses the `compatibleComponents` metadata on each preset to determine which
     * presets are valid for the current component selection:
     * - No component selected → show presets with compatibleComponents: ['default']
     * - component: 'shaped'   → show presets with compatibleComponents: ['shaped']
     * - Presets without compatibleComponents are always shown (legacy / no restriction)
     *
     * @returns {TemplateResult}
     * @private
     */
    _renderPresetSelector() {
        const stylePresetManager = window.lcards?.core?.stylePresetManager;
        if (!stylePresetManager) return html``;

        const allPresets = stylePresetManager.getAvailablePresets('slider');
        const currentComponent = this.config?.component || '';

        // Filter presets by compatibility with the selected component
        const filteredPresets = allPresets.filter(name => {
            const presetData = stylePresetManager.getPreset('slider', name);
            if (!presetData) return true;

            const compatible = presetData.compatibleComponents;
            if (!compatible) return true; // No restriction — always visible

            if (!currentComponent) {
                // No component selected: show 'default' compatible presets
                return compatible.includes('default');
            }

            return compatible.includes(currentComponent);
        });

        if (filteredPresets.length === 0) {
            return html`
                <ha-textfield
                    .label=${'Style Preset'}
                    .value=${'No presets available for this component'}
                    .disabled=${true}
                    .helper=${'Change or clear the component to see presets'}
                ></ha-textfield>
            `;
        }

        const options = [
            { value: '', label: '— None —' },
            ...filteredPresets.map(name => ({
                value: name,
                label: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            }))
        ];

        const currentPreset = this.config?.preset || '';
        const isIncompatible = currentPreset && !filteredPresets.includes(currentPreset);

        const helperText = currentComponent
            ? `Presets compatible with the '${currentComponent}' component`
            : 'Quick styling — select a component first to narrow the list';

        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Style Preset'}
                .helper=${helperText}
                .selector=${{ select: { mode: 'dropdown', options } }}
                .value=${currentPreset}
                @value-changed=${(e) => this._setConfigValue('preset', e.detail.value || undefined)}>
            </ha-selector>
            ${isIncompatible ? html`
                <ha-alert alert-type="warning">
                    Preset '${currentPreset}' is not compatible with component '${currentComponent}'.
                    Choose a compatible preset or clear the component field.
                </ha-alert>
            ` : ''}
        `;
    }

    /**
     * Render attribute selector dropdown
     * @returns {TemplateResult}
     * @private
     */
    _renderAttributeSelector() {
        const entityId = this.config?.entity;
        const currentValue = this.config?.control?.attribute || '';

        // Build attribute list from entity (no empty/state sentinel — handled by clear button)
        const entity = this.hass?.states?.[entityId];
        const attributes = entity ? Object.keys(entity.attributes || {}) : [];
        const options = attributes.map(attr => ({ value: attr, label: attr }));

        const isValidAttribute = !currentValue ||
                                (entity?.attributes && currentValue in entity.attributes);

        return html`
            <div style="display:flex; gap:8px; align-items:flex-end;">
                <ha-selector
                    style="flex:1;"
                    .hass=${this.hass}
                    .label=${'Attribute'}
                    .helper=${'Entity attribute to control (e.g. brightness). Clear to use entity state.'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: options.length ? options : [{ value: '', label: '— no attributes —' }],
                            custom_value: true
                        }
                    }}
                    .value=${currentValue}
                    @value-changed=${(e) => this._handleAttributeChange(e)}>
                </ha-selector>
                ${currentValue ? html`
                    <ha-icon-button
                        title="Clear — use entity state"
                        .path=${'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z'}
                        // @ts-ignore - TS2345: auto-suppressed
                        @click=${() => this._handleAttributeChange(/** @type {any} */ ({ detail: { value: '' } }))}>
                    </ha-icon-button>
                ` : ''}
            </div>

            ${!isValidAttribute && currentValue ? html`
                <lcards-message
                    type="warning"
                    message="⚠️ Attribute '${currentValue}' does not exist on entity '${entityId}'. The slider will control the entity state instead.">
                </lcards-message>
            ` : ''}
        `;
    }

    /**
     * Handle attribute dropdown change
     * @param {CustomEvent} event
     * @private
     */
    _handleAttributeChange(event) {
        const value = event.detail?.value;
        // Empty string, null, or undefined → remove attribute key entirely.
        // _updateConfig uses deepMerge which cannot delete keys, so we pre-patch
        // this.config directly then call _updateConfig({}) to trigger the normal
        // validation / YAML-sync / fireEvent pipeline without any merge interference.
        const control = { ...this.config?.control };
        if (value !== null && value !== undefined && value !== '') {
            control.attribute = value;
        } else {
            delete control.attribute;
        }
        this.config = { ...this.config, control };
        this._updateConfig({});
    }

    /**
     * Define editor tabs - 5 tabs + utility tabs from base class
     * Conditionally adds Component Options tab when component has configurableOptions
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        const baseTabs = [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) }
        ];

        // Add Component Options tab right after Config if component has configurable options
        const componentName = this.config?.component;
        if (componentName) {
            const metadata = this._getComponentMetadata(componentName);
            if (metadata?.configurableOptions?.length > 0) {
                baseTabs.push({
                    label: 'Component Options',
                    content: () => this._renderComponentOptionsTab()
                });
            }
        }

        // Add remaining tabs
        baseTabs.push(
            { label: 'Slider Track', content: () => this._renderTrackTab() },
            { label: 'Borders', content: () => this._renderBordersTab() },
            { label: 'Text Fields', content: () => this._renderTextTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            // Sound tab: per-card mute + slider & action event overrides
            { label: 'Sound', content: () => this._renderSoundTab([
                'slider_drag_start', 'slider_change', 'slider_drag_end',
                'card_tap', 'card_hold', 'card_double_tap'
            ]) }
        );

        return [
            ...baseTabs,
            ...this._getUtilityTabs()
        ];
    }

    // ============================================================================
    // TAB RENDERERS - 8-TAB STRUCTURE
    // ============================================================================

    /**
     * Config tab - declarative configuration
     * Consolidated: Component, Preset, Entity, Card ID
     */
    _getConfigTabConfig() {
        const state = this._getSliderState();

        return [
            {
                type: 'section',
                header: 'Component & Preset',
                description: 'Choose your slider type and a style presets',
                icon: 'mdi:shape',
                expanded: true,
                outlined: true,
                children: [
                    {
                        type: 'grid',
                        columns: 2,
                        children: [
                            {
                                type: 'field',
                                path: 'component',
                                label: 'Component',
                                helper: 'Shell SVG (basic, picard, etc.)'
                            },
                            {
                                type: 'custom',
                                render: () => this._renderOrientationSelector()
                            }
                        ]
                    },
                    {
                        type: 'custom',
                        render: () => this._renderPresetSelector()
                    },
                    ...(this.config.component ? [{
                        type: 'custom',
                        render: () => this._renderComponentInfo(this.config.component)
                    }] : [])
                ]
            },

            {
                type: 'section',
                header: 'Card Identification',
                description: 'ID and tags for rule targeting',
                icon: 'mdi:tag',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'field',
                        path: 'id',
                        label: 'Card ID',
                        helper: '[Optional] Custom ID for targeting with rules and animations'
                    },
                    {
                        type: 'field',
                        path: 'tags',
                        label: 'Tags',
                        helper: 'Select existing tags or type new ones for rule targeting'
                    }
                ]
            },

            {
                type: 'section',
                header: 'Sizing',
                description: 'Override card dimensions — useful in stacks, overlays, or any auto-height container',
                icon: 'mdi:resize',
                expanded: false,
                outlined: true,
                children: [
                    {
                        type: 'grid',
                        columns: 2,
                        children: [
                            { type: 'field', path: 'height' },
                            { type: 'field', path: 'width' }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Track Tab - Pills or Gauge styling (dynamic based on track type)
     * @returns {TemplateResult}
     * @private
     */
    _renderTrackTab() {
        const state = this._getSliderState();
        const trackType = state.trackType; // Cache to ensure consistency

        lcardsLog.debug('[LCARdSSliderEditor] Rendering track tab with type:', trackType, 'Full state:', state);

        return html`
            <!-- Entity Configuration -->
            <lcards-form-section
                header="Entity Configuration"
                description="Entity to control and basic settings"
                icon="mdi:home-automation"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'entity', {
                    label: 'Entity',
                    helper: 'Entity to control/display (light, cover, fan, sensor, etc.)'
                })}

                ${this._renderAttributeSelector()}
            </lcards-form-section>

            <!-- Visual Range & Direction Configurator -->
            <lcards-form-section
                header="Range & Direction"
                description="Interactive visual configuration for slider ranges and direction"
                icon="mdi:tune-variant"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, 'control.locked', {
                        label: 'Display Only',
                        helper: 'Disable interaction (auto-locked for sensors)'
                    })}

                    ${FormField.renderField(this, 'control.step', {
                        label: 'Step Size',
                        helper: 'Increment size'
                    })}
                </lcards-grid-layout>

                <lcards-slider-range-visualizer
                    .displayMin=${this.config?.style?.track?.display?.min ?? this.config?.control?.min ?? 0}
                    .displayMax=${this.config?.style?.track?.display?.max ?? this.config?.control?.max ?? 100}
                    .controlMin=${this.config?.control?.min ?? 0}
                    .controlMax=${this.config?.control?.max ?? 100}
                    .orientation=${state.orientation}
                    .invertFill=${this.config?.style?.track?.invert_fill ?? false}
                    .invertValue=${this.config?.control?.invert_value ?? false}
                    .currentValue=${50}
                    .unit=${this.config?.style?.track?.display?.unit ?? ''}
                    @range-changed=${this._handleRangeChanged}
                    @direction-changed=${this._handleDirectionChanged}>
                </lcards-slider-range-visualizer>
            </lcards-form-section>

            <!-- Dynamic: Pills, Gauge, or Shaped Configuration -->
            ${trackType === 'pills'
                ? this._renderPillsConfiguration()
                : trackType === 'shaped'
                    ? this._renderShapedConfiguration()
                    : this._renderGaugeConfiguration()}

            <!-- Track Margins -->
            <lcards-form-section
                header="Track Margins"
                description="Spacing around slider track"
                icon="mdi:arrow-expand-all"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-object-editor
                    .editor=${this}
                    path="style.track.margin"
                    .properties=${['top', 'right', 'bottom', 'left']}
                    controlType="number"
                    .controlConfig=${{ min: 0, max: 100, mode: 'box', unit_of_measurement: 'px' }}
                    columns="2">
                </lcards-object-editor>
            </lcards-form-section>

            <!-- Color-Coded Ranges -->
            ${this._renderRangesConfiguration()}
        `;
    }

    /**
     * Ranges Configuration - Color-coded bands and value markers
     * @returns {TemplateResult}
     * @private
     */
    _renderRangesConfiguration() {
        const ranges = this.config?.style?.ranges || [];
        const trackType = this._getSliderState().trackType;

        return html`
            <lcards-form-section
                header="Ranges &amp; Value Markers"
                description="Colour-coded bands and live-value indicators on the track"
                icon="mdi:palette"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message
                    type="info"
                    message="Band ranges colour a fixed zone on the track. Value markers track a live entity attribute (e.g. current temperature) — shown as an indicator shape in gauge mode and a highlighted pill in pills mode.">
                </lcards-message>

                <div class="range-list" style="display: flex; flex-direction: column; gap: 8px; margin: 16px 0;">
                    ${ranges.length === 0 ? html`
                        <div style="text-align: center; padding: 32px 16px; color: var(--secondary-text-color);">
                            <ha-icon icon="mdi:palette-outline" style="font-size: 48px; opacity: 0.3; display: block; margin: 0 auto 12px;"></ha-icon>
                            <div style="font-weight: 600; margin-bottom: 4px;">No ranges defined</div>
                            <div>Add a band range or a value marker</div>
                        </div>
                    ` : html`
                        ${ranges.map((range, index) => this._renderRangeItem(range, index, trackType))}
                    `}
                </div>

                <!-- Add Buttons -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <ha-button @click=${() => this._addBandRange()}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Band Range
                    </ha-button>
                    <ha-button @click=${() => this._addMarkerRange()}>
                        <ha-icon icon="mdi:map-marker-plus" slot="start"></ha-icon>
                        Add Value Marker
                    </ha-button>
                </div>
            </lcards-form-section>
        `;
    }

    /**
     * Render a single range item — branches on band vs marker mode
     * @param {Object} range - Range configuration
     * @param {number} index - Range index
     * @param {string} trackType - Current track type ('pills'|'gauge'|'shaped')
     * @returns {TemplateResult}
     * @private
     */
    _renderRangeItem(range, index, trackType = 'pills') {
        const basePath = `style.ranges.${index}`;
        const isExpanded = this._expandedRanges[index] || false;
        const isMarker = 'value' in range;

        const rangeDisplay = isMarker
            ? `Marker: ${String(range.value).substring(0, 40)}`
            : `Band: ${range.min ?? 0} – ${range.max ?? 100}`;

        const itemStyle = 'background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;';
        const headerStyle = 'display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; user-select: none; background: var(--secondary-background-color);';
        const iconColor = range.color || 'var(--primary-color)';
        const iconStyle = `color: ${iconColor}; --mdc-icon-size: 24px;`;
        const infoStyle = 'flex: 1; min-width: 0;';
        const labelStyle = 'font-weight: 600; font-size: 14px;';
        const valueStyle = 'font-size: 12px; color: var(--secondary-text-color); margin-top: 2px;';
        const typeBadgeStyle = `font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background: ${isMarker ? 'var(--info-color, #4fc3f7)' : 'var(--success-color, #4caf50)'}22; color: ${isMarker ? 'var(--info-color, #4fc3f7)' : 'var(--success-color, #4caf50)'};`;
        const actionsStyle = 'display: flex; gap: 4px; align-items: center;';
        const expandIconStyle = `transition: transform 0.2s;${isExpanded ? ' transform: rotate(180deg);' : ''}`;
        const contentStyle = 'padding: 16px; border-top: 1px solid var(--divider-color); display: flex; flex-direction: column; gap: 12px;';

        return html`
            <div class="range-item" style="${itemStyle}">
                <!-- Range Header -->
                <div class="range-header" style="${headerStyle}" @click=${() => this._toggleRangeExpanded(index)}>
                    <ha-icon style="${iconStyle}" icon="${isMarker ? 'mdi:map-marker' : 'mdi:chart-box'}"></ha-icon>

                    <div style="${infoStyle}">
                        <div style="${labelStyle}">
                            ${isMarker ? 'Value Marker' : 'Band Range'} ${index + 1}
                            <span style="${typeBadgeStyle}">${isMarker ? 'MARKER' : 'BAND'}</span>
                        </div>
                        <div style="${valueStyle}">${rangeDisplay}</div>
                    </div>

                    <div style="${actionsStyle}">
                        <ha-icon-button
                            @click=${(e) => this._deleteRange(e, index)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>

                    <ha-icon style="${expandIconStyle}" icon="mdi:chevron-down"></ha-icon>
                </div>

                <!-- Expanded Content -->
                ${isExpanded ? html`
                    <div style="${contentStyle}">
                        ${isMarker
                            ? this._renderMarkerRangeContent(range, basePath, trackType)
                            : this._renderBandRangeContent(range, basePath, trackType)
                        }
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render expanded content for band ranges (min/max/color/opacity)
     * @private
     */
    _renderBandRangeContent(range, basePath, trackType = 'gauge') {
        const opacityHelper = (trackType === 'pills' || trackType === 'shaped')
            ? 'Gauge mode only. In pills mode use Track Settings › Appearance › Unfilled Opacity instead.'
            : 'Background opacity (0–1, default: 0.3)';
        return html`
            <lcards-grid-layout columns="2">
                ${FormField.renderField(this, `${basePath}.min`, {
                    label: 'Min Value',
                    helper: 'Range start (in display space)'
                })}
                ${FormField.renderField(this, `${basePath}.max`, {
                    label: 'Max Value',
                    helper: 'Range end (in display space)'
                })}
            </lcards-grid-layout>

            <lcards-color-section
                .editor=${this}
                .entityId=${this.config?.entity || ''}
                basePath="${basePath}.color"
                header="Band Colour"
                description="Background colour for this zone"
                ?singleColor=${true}
                ?expanded=${true}
                ?useColorPicker=${true}>
            </lcards-color-section>

            ${FormField.renderField(this, `${basePath}.opacity`, {
                label: 'Opacity',
                helper: opacityHelper
            })}
        `;
    }

    /**
     * Render expanded content for value markers
     * Shows: value template, color, label, + mode-specific sub-sections
     * @private
     */
    _renderMarkerRangeContent(range, basePath, trackType) {
        const isGauge = trackType === 'gauge';
        const isPills = trackType === 'pills' || trackType === 'shaped';
        const indExpanded = this._expandedRanges[`${basePath}_ind`] || false;
        const pillExpanded = this._expandedRanges[`${basePath}_pill`] || false;

        return html`
            <!-- Value template -->
            <div>
                <ha-textfield
                    .label=${'Marker Value / Template'}
                    .helper=${'Template resolving to a position on the track. Examples: {entity.attributes.current_temperature}, {states.sensor.outdoor_temp.state}, [[[return hass.states["sensor.x"].state]]]'}
                    .value=${String(range.value ?? '')}
                    @change=${(e) => this._setConfigPath(`${basePath}.value`, e.target.value)}
                    style="width: 100%;">
                </ha-textfield>
            </div>

            ${isPills ? html`
                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="${basePath}.color"
                    header="Pill Highlight Colour"
                    description="Colour used to highlight this marker pill"
                    ?singleColor=${true}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            ` : ''}

            <!-- Indicator shape settings (gauge mode) -->
            <lcards-form-section
                header="Indicator Shape"
                description="Gauge mode: shape used for this marker. Falls back to the global gauge indicator settings if not set."
                icon="mdi:map-marker"
                ?expanded=${indExpanded}
                ?outlined=${true}
                headerLevel="5"
                @expanded-changed=${(e) => { this._expandedRanges[`${basePath}_ind`] = e.detail.expanded; this.requestUpdate(); }}>

                ${!isGauge ? html`
                    <lcards-message type="info"
                        message="These settings only apply in gauge mode. Switch the preset to a gauge style to use them.">
                    </lcards-message>
                ` : ''}

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, `${basePath}.indicator.type`, {
                        label: 'Shape',
                        // @ts-ignore - TS2353: auto-suppressed
                        type: 'select',
                        options: [
                            { value: '', label: '— Inherit from gauge.indicator —' },
                            { value: 'line', label: 'Line' },
                            { value: 'round', label: 'Round (ellipse)' },
                            { value: 'triangle', label: 'Triangle' }
                        ],
                        helper: 'Defaults to style.gauge.indicator.type'
                    })}

                    ${FormField.renderField(this, `${basePath}.indicator.rotation`, {
                        label: 'Rotation (°)',
                        helper: 'Rotation in degrees'
                    })}
                </lcards-grid-layout>

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, `${basePath}.indicator.size.width`, {
                        label: 'Width (px)',
                        helper: 'Indicator width'
                    })}
                    ${FormField.renderField(this, `${basePath}.indicator.size.height`, {
                        label: 'Height (px)',
                        helper: 'Indicator height'
                    })}
                </lcards-grid-layout>

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, `${basePath}.indicator.offset.x`, {
                        label: 'Offset X (px)'
                    })}
                    ${FormField.renderField(this, `${basePath}.indicator.offset.y`, {
                        label: 'Offset Y (px)'
                    })}
                </lcards-grid-layout>

                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="${basePath}.indicator.color"
                    header="Indicator Colour"
                    description="Colour of the indicator shape. Fallback: style.gauge.marker_indicator.color → white"
                    ?singleColor=${true}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, `${basePath}.indicator.border.enabled`, {
                        label: 'Show Border',
                        // @ts-ignore - TS2353: auto-suppressed
                        type: 'boolean',
                        helper: 'Outline border on the indicator shape'
                    })}
                    ${FormField.renderField(this, `${basePath}.indicator.border.width`, {
                        label: 'Border Width (px)'
                    })}
                </lcards-grid-layout>

                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="${basePath}.indicator.border.color"
                    header="Border Colour"
                    ?singleColor=${true}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Pill style settings (pills mode) -->
            <lcards-form-section
                header="Pill Marker Style"
                description="Pills mode: how the highlighted pill looks."
                icon="mdi:pill"
                ?expanded=${pillExpanded}
                ?outlined=${true}
                headerLevel="5"
                @expanded-changed=${(e) => { this._expandedRanges[`${basePath}_pill`] = e.detail.expanded; this.requestUpdate(); }}>

                ${!isPills ? html`
                    <lcards-message type="info"
                        message="These settings only apply in pills mode. Switch the preset to a pills style to use them.">
                    </lcards-message>
                ` : ''}

                <lcards-grid-layout columns="2">
                    ${FormField.renderField(this, `${basePath}.pill_style.stroke`, {
                        label: 'Show Outline',
                        // @ts-ignore - TS2353: auto-suppressed
                        type: 'boolean',
                        helper: 'Draw a border on the marker pill to distinguish it from neighbours'
                    })}
                    ${FormField.renderField(this, `${basePath}.pill_style.stroke_width`, {
                        label: 'Outline Width (px)',
                        helper: 'Border thickness (default: 2)'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Toggle range expanded state
     * @param {number} index - Range index
     * @private
     */
    _toggleRangeExpanded(index) {
        this._expandedRanges[index] = !this._expandedRanges[index];
        this.requestUpdate();
    }

    /**
     * Add a new band range (min/max/color zone)
     * @private
     */
    _addBandRange() {
        const ranges = this.config?.style?.ranges || [];
        const newRange = {
            min: 0,
            max: 100,
            color: 'var(--primary-color)',
            label: '',
            opacity: 0.3
        };
        this._updateConfig({
            style: { ...this.config.style, ranges: [...ranges, newRange] }
        });
        // Auto-expand the new item
        this._expandedRanges[ranges.length] = true;
        this.requestUpdate();
    }

    /**
     * Add a new value marker range
     * @private
     */
    _addMarkerRange() {
        const ranges = this.config?.style?.ranges || [];
        const newRange = {
            value: '',
            color: 'var(--warning-color)',
            label: ''
        };
        this._updateConfig({
            style: { ...this.config.style, ranges: [...ranges, newRange] }
        });
        // Auto-expand the new item
        this._expandedRanges[ranges.length] = true;
        this.requestUpdate();
    }

    /**
     * Helper to set a deeply-nested config value using a dot-path
     * @param {string} path - Dot-separated path e.g. 'style.ranges.0.value'
     * @param {*} value - Value to set
     * @private
     */
    _setConfigPath(path, value) {
        const parts = path.split('.');
        const config = JSON.parse(JSON.stringify(this.config || {}));
        let cursor = config;
        for (let i = 0; i < parts.length - 1; i++) {
            // @ts-ignore - TS2345: auto-suppressed
            const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
            if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== 'object') {
                // @ts-ignore - TS2345: auto-suppressed
                cursor[key] = isNaN(parts[i + 1]) ? {} : [];
            }
            cursor = cursor[key];
        }
        // @ts-ignore - TS2345: auto-suppressed
        const lastKey = isNaN(parts[parts.length - 1]) ? parts[parts.length - 1] : parseInt(parts[parts.length - 1]);
        if (value === '' || value === undefined || value === null) {
            delete cursor[lastKey];
        } else {
            cursor[lastKey] = value;
        }
        this._updateConfig(config);
    }

    /**
     * Delete a range from the configuration
     * @param {Event} e - Click event
     * @param {number} index - Range index to delete
     * @private
     */
    _deleteRange(e, index) {
        e.stopPropagation(); // Prevent expansion panel from toggling
        e.preventDefault(); // Prevent any default action

        const ranges = this.config?.style?.ranges || [];
        const updatedRanges = ranges.filter((_, i) => i !== index);

        this._updateConfig({
            style: {
                ...this.config.style,
                ranges: updatedRanges
            }
        });
    }

    /**
     * Pills Configuration - Pills settings with INLINE gradient colors
     * @returns {TemplateResult}
     * @private
     */
    _renderPillsConfiguration() {
        return html`
            <lcards-form-section
                header="Pills Settings"
                description="Segment configuration and appearance"
                icon="mdi:view-sequential"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="1">
                    ${FormField.renderField(this, 'style.track.segments.count', {
                        label: 'Segment Count',
                        helper: 'Number of pill segments'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.gap', {
                        label: 'Gap Size (px)',
                        helper: 'Space between segments'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.shape.radius', {
                        label: 'Border Radius (px)',
                        helper: 'Roundness of pill corners'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.size.height', {
                        label: 'Pill Height (px)',
                        helper: 'Height of each pill'
                    })}
                </lcards-grid-layout>

                <!-- INLINE COLORS: Gradient colors appear right here with pills settings -->
                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    header="Gradient Colours"
                    description="Start and end colours for pill gradient"
                    .colorPaths=${[
                        { path: 'style.track.segments.gradient.start', label: 'Gradient Start', helper: 'Colour at minimum value (left/bottom)' },
                        { path: 'style.track.segments.gradient.end', label: 'Gradient End', helper: 'Colour at maximum value (right/top)' }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>

            </lcards-form-section>

            <!-- Opacity Settings -->
            <lcards-form-section
                header="Appearance"
                description="Opacity for filled and unfilled pills"
                icon="mdi:opacity"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout columns="1">
                    ${FormField.renderField(this, 'style.track.segments.appearance.unfilled.opacity', {
                        label: 'Unfilled Opacity',
                        helper: 'Opacity for unfilled pills (0-1, default: 0.2)'
                    })}

                    ${FormField.renderField(this, 'style.track.segments.appearance.filled.opacity', {
                        label: 'Filled Opacity',
                        helper: 'Opacity for filled pills (0-1, default: 1.0)'
                    })}
                </lcards-grid-layout>
            </lcards-form-section>
        `;
    }

    /**
     * Gauge Configuration - Gauge settings with INLINE colors per section
     * @returns {TemplateResult}
     * @private
     */
    _renderGaugeConfiguration() {
        return html`
            <!-- Progress Bar with INLINE COLOR -->
            <lcards-form-section
                header="Progress Bar"
                description="Current value indicator bar"
                icon="mdi:progress-check"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.gauge.progress_bar.height', {
                        label: 'Height',
                        helper: 'Cross-sectional thickness (width in vertical, height in horizontal)'
                    })}

                    ${FormField.renderField(this, 'style.gauge.progress_bar.align', {
                        label: 'Alignment',
                        helper: 'Cross-sectional alignment (left/middle/right in vertical)',
                        // @ts-ignore - TS2353: auto-suppressed
                        type: 'select',
                        mode: 'dropdown',
                        options: [
                            { value: 'start', label: 'Start' },
                            { value: 'middle', label: 'Middle' },
                            { value: 'end', label: 'End' }
                        ]
                    })}

                    ${FormField.renderField(this, 'style.gauge.progress_bar.layer', {
                        label: 'Layer',
                        helper: 'Render behind or in front of gauge tick marks',
                        // @ts-ignore - TS2353: auto-suppressed
                        type: 'select',
                        mode: 'dropdown',
                        options: [
                            { value: 'background', label: 'Background (behind ticks)' },
                            { value: 'foreground', label: 'Foreground (in front of ticks)' }
                        ]
                    })}
                </lcards-grid-layout>

                <!-- Progress bar padding -->
                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.gauge.progress_bar.padding.top', {
                        label: 'Padding Top',
                        helper: 'Top padding in pixels'
                    })}
                    ${FormField.renderField(this, 'style.gauge.progress_bar.padding.right', {
                        label: 'Padding Right',
                        helper: 'Right padding in pixels'
                    })}
                    ${FormField.renderField(this, 'style.gauge.progress_bar.padding.bottom', {
                        label: 'Padding Bottom',
                        helper: 'Bottom padding in pixels'
                    })}
                    ${FormField.renderField(this, 'style.gauge.progress_bar.padding.left', {
                        label: 'Padding Left',
                        helper: 'Left padding in pixels'
                    })}
                </lcards-grid-layout>

                <!-- INLINE: Progress bar color -->
                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.gauge.progress_bar.color"
                    header="Progress Bar Colour"
                    description="Colour of the filled progress bar"
                    ?singleColor=${true}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Tick Marks & Scale with INLINE COLOR -->
            <lcards-form-section
                header="Tick Marks & Scale"
                description="Major and minor tick marks"
                icon="mdi:ruler"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <!-- Major Ticks Subsection -->
                <lcards-form-section
                    header="Major Tick Marks"
                    description="Primary scale marks"
                    icon="mdi:format-list-bulleted"
                    ?expanded=${true}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.enabled', {
                            label: 'Show Major Ticks'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.interval', {
                        label: 'Interval',
                        helper: 'Value interval between major ticks'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.major.width', {
                        label: 'Line Width',
                        helper: 'Major tick line width in pixels'
                    })}
                    </lcards-grid-layout>
                </lcards-form-section>

                <!-- Minor Ticks Subsection -->
                <lcards-form-section
                    header="Minor Tick Marks"
                    description="Secondary scale marks"
                    icon="mdi:format-list-bulleted-square"
                    ?expanded=${false}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.enabled', {
                            label: 'Show Minor Ticks'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.interval', {
                        label: 'Interval',
                        helper: 'Value interval between minor ticks'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.height', {
                        label: 'Height',
                        helper: 'Minor tick height in pixels'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.tick_marks.minor.width', {
                        label: 'Line Width',
                        helper: 'Minor tick line width in pixels'
                    })}
                    </lcards-grid-layout>
                </lcards-form-section>

                <!-- State-aware color sections for ticks -->
                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.gauge.scale.tick_marks.major.color"
                    header="Major Tick Colours"
                    description="State-based colours for major tick marks - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.gauge.scale.tick_marks.minor.color"
                    header="Minor Tick Colours"
                    description="State-based colours for minor tick marks - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <!-- Scale Labels Subsection with INLINE COLOR -->
                <lcards-form-section
                    header="Scale Labels"
                    description="Numeric labels on scale"
                    icon="mdi:format-text"
                    ?expanded=${false}
                    ?outlined=${false}
                    headerLevel="5">

                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'style.gauge.scale.labels.enabled', {
                            label: 'Show Scale Labels'
                        })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.show_unit', {
                            label: 'Show Unit',
                            helper: 'Show unit suffix on labels. Disable to hide even when entity has a unit.'
                        })}

                        ${(this.config?.style?.gauge?.scale?.labels?.show_unit ?? true) ? FormField.renderField(this, 'style.gauge.scale.labels.unit', {
                            label: 'Unit',
                            helper: 'Unit to append to values (e.g. °C, %, W). Leave empty to use entity unit.'
                        }) : html``}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.font_size', {
                        label: 'Font Size',
                        helper: 'Label font size in pixels'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.padding', {
                        label: 'Padding',
                        helper: 'Space between tick and label in pixels'
                    })}
                    </lcards-grid-layout>

                    <!-- State-aware label colors -->
                    <lcards-color-section-v2
                        .editor=${this}
                        .entityId=${this.config?.entity || ''}
                        basePath="style.gauge.scale.labels.color"
                        header="Label Colours"
                        description="State-based colours for scale numeric labels - supports custom states"
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                </lcards-form-section>
            </lcards-form-section>

            <!-- Value Indicator with INLINE COLORS -->
            <lcards-form-section
                header="Value Indicator"
                description="Current value marker (optional)"
                icon="mdi:arrow-up-bold"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'style.gauge.indicator.enabled', {
                    label: 'Show Indicator',
                    helper: 'Display a marker at the current value'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.type', {
                    label: 'Indicator Type',
                    helper: 'line: rectangle, round: ellipse/circle, triangle: rotatable triangle'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.size.width', {
                    label: 'Width',
                    helper: 'Indicator width in pixels (or rx for round type)'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.size.height', {
                    label: 'Height',
                    helper: 'Indicator height in pixels (or ry for round type)'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.rotation', {
                    label: 'Rotation',
                    helper: 'Rotation angle in degrees (for triangle type, -180 to 180)'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.offset.x', {
                    label: 'Offset X',
                    helper: 'Horizontal offset from progress bar end (pixels)'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.offset.y', {
                    label: 'Offset Y',
                    helper: 'Vertical offset from progress bar end (pixels)'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.border.enabled', {
                    label: 'Show Border',
                    helper: 'Add border around indicator'
                })}

                ${FormField.renderField(this, 'style.gauge.indicator.border.width', {
                    label: 'Border Width',
                    helper: 'Border width in pixels'
                })}

                <!-- INLINE: Indicator colors -->
                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    header="Indicator Colours"
                    description="Colours for value indicator marker"
                    .colorPaths=${[
                        {
                            path: 'style.gauge.indicator.color',
                            label: 'Indicator Colour',
                            helper: 'Colour of value indicator'
                        },
                        {
                            path: 'style.gauge.indicator.border.color',
                            label: 'Border Colour',
                            helper: 'Colour of indicator border'
                        }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>
        `;
    }

    /**
     * Shaped Configuration — shape type, fill colour, track background, and label band sizes.
     * Used when the shaped component is active (e.g. shaped-vertical / shaped-horizontal preset).
     * @returns {TemplateResult}
     * @private
     */
    _renderShapedConfiguration() {
        const orientation = this.config?.style?.track?.orientation || 'vertical';
        const isVertical  = orientation === 'vertical';

        return html`
            <!-- Shape Type -->
            <lcards-form-section
                header="Shape"
                description="Geometry used to clip the slider fill"
                icon="mdi:shape"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${FormField.renderField(this, 'style.shaped.type', {
                    label: 'Shape Type',
                    helper: 'lozenge (pill), rect, rounded, diamond, hexagon, polygon, path'
                })}

                ${FormField.renderField(this, 'style.shaped.radius', {
                    label: 'Corner Radius (px)',
                    helper: 'Override auto radius — lozenge defaults to min(w,h)/2, rounded defaults to 8'
                })}
            </lcards-form-section>

            <!-- Fill & Background Colors -->
            <lcards-form-section
                header="Colours"
                description="Fill and background colours for the shape interior"
                icon="mdi:water"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.shaped.fill.color"
                    header="Fill Colour"
                    description="Colour of the value fill (the filled portion)"
                    ?singleColor=${true}
                    ?expanded=${true}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                <lcards-color-section
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.shaped.track.background"
                    header="Background Colour"
                    description="Colour of the empty (unfilled) interior of the shape"
                    ?singleColor=${true}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
            </lcards-form-section>

            <!-- Label Band Sizes -->
            <lcards-form-section
                header="Label Bands"
                description="Pixels reserved outside the shape body for text fields"
                icon="mdi:format-text-rotation-none"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${isVertical ? html`
                    <lcards-grid-layout columns="2">
                        ${FormField.renderField(this, 'style.shaped.text_bands.top.size', {
                            label: 'Top Band (px)',
                            helper: 'Space above shape — typically for value label'
                        })}
                        ${FormField.renderField(this, 'style.shaped.text_bands.bottom.size', {
                            label: 'Bottom Band (px)',
                            helper: 'Space below shape — typically for name label'
                        })}
                    </lcards-grid-layout>
                ` : html`
                    <lcards-grid-layout columns="2">
                        ${FormField.renderField(this, 'style.shaped.text_bands.left.size', {
                            label: 'Left Band (px)',
                            helper: 'Space to the left of the shape'
                        })}
                        ${FormField.renderField(this, 'style.shaped.text_bands.right.size', {
                            label: 'Right Band (px)',
                            helper: 'Space to the right of the shape'
                        })}
                    </lcards-grid-layout>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Text Tab - Standard multi-text editor
     * @returns {TemplateResult}
     * @private
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
     * Render the Corner Radius section for the Borders tab.
     *
     * Writes to style.border.radius — either a uniform number/string or a
     * per-corner object {top_left, top_right, bottom_right, bottom_left}.
     *
     * Each field accepts a plain number, a px/rem string, or a CSS variable
     * such as var(--ha-card-border-radius).
     *
     * @returns {TemplateResult}
     * @private
     */
    _renderBorderRadiusSection() {
        const currentRadius = this.config?.style?.border?.radius;
        const isPerCorner = typeof currentRadius === 'object' && currentRadius !== null;

        /** Convert any config value to a display string for ha-textfield */
        const toStr = (v) => (v === undefined || v === null) ? '' : String(v);

        /**
         * Parse a text-field string to Number when it looks like a bare number,
         * otherwise keep as string (CSS var / px / rem).  Returns undefined for
         * empty strings so the key is removed from config.
         */
        const parseVal = (str) => {
            if (!str || !str.trim()) return undefined;
            const s = str.trim();
            const n = parseFloat(s);
            return (!isNaN(n) && String(n) === s) ? n : s;
        };

        const handleUniform = (e) => {
            const parsed = parseVal(e.target.value);
            this._setConfigValue('style.border.radius', parsed);
        };

        const handleCorner = (corner, e) => {
            const parsed = parseVal(e.target.value);
            const existing = this.config?.style?.border?.radius;
            const obj = (typeof existing === 'object' && existing !== null)
                ? { ...existing }
                : { top_left: 0, top_right: 0, bottom_right: 0, bottom_left: 0 };
            if (parsed === undefined) {
                delete obj[corner];
            } else {
                obj[corner] = parsed;
            }
            this._setConfigValue('style.border.radius', obj);
        };

        const handleModeToggle = (e) => {
            const wantPerCorner = e.detail.value;
            if (wantPerCorner && !isPerCorner) {
                // Convert current uniform value to per-corner object
                const cur = currentRadius;
                const n = (typeof cur === 'number') ? cur
                        : (typeof cur === 'string' ? (parseFloat(cur) || 0) : 0);
                this._setConfigValue('style.border.radius', {
                    top_left: n, top_right: n,
                    bottom_right: n, bottom_left: n
                });
            } else if (!wantPerCorner && isPerCorner) {
                // Convert per-corner to a uniform average (or 0)
                const vals = Object.values(currentRadius)
                    .map(v => typeof v === 'number' ? v : (parseFloat(v) || 0))
                    .filter(v => !isNaN(v));
                const avg = vals.length
                    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                    : 0;
                this._setConfigValue('style.border.radius', avg || undefined);
            }
        };

        return html`
            <lcards-form-section
                header="Corner Radius"
                description="Round the card corners — clips all borders and content uniformly"
                icon="mdi:rounded-corner"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message
                    type="info"
                    message="Clips the entire card with rounded corners via SVG. Supports pixel numbers (12), px/rem strings (12px), CSS variables (var(--ha-card-border-radius)), or per-corner control for LCARS end-cap styling (e.g. round only the free end of a left-bordered slider).">
                </lcards-message>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ boolean: {} }}
                    .value=${isPerCorner}
                    .label=${'Per-Corner Radius'}
                    @value-changed=${handleModeToggle}>
                </ha-selector>

                ${!isPerCorner ? html`
                    <ha-textfield
                        label="Radius"
                        .value=${toStr(currentRadius)}
                        helper="Number (12), px (12px), rem (0.75rem), or CSS var: var(--ha-card-border-radius)"
                        helperPersistent
                        @change=${handleUniform}>
                    </ha-textfield>
                ` : html`
                    <lcards-grid-layout>
                        <ha-textfield
                            label="Top Left"
                            .value=${toStr(currentRadius?.top_left)}
                            helper="Number, px, rem, or CSS var"
                            @change=${(e) => handleCorner('top_left', e)}>
                        </ha-textfield>
                        <ha-textfield
                            label="Top Right"
                            .value=${toStr(currentRadius?.top_right)}
                            helper="Number, px, rem, or CSS var"
                            @change=${(e) => handleCorner('top_right', e)}>
                        </ha-textfield>
                        <ha-textfield
                            label="Bottom Left"
                            .value=${toStr(currentRadius?.bottom_left)}
                            helper="Number, px, rem, or CSS var"
                            @change=${(e) => handleCorner('bottom_left', e)}>
                        </ha-textfield>
                        <ha-textfield
                            label="Bottom Right"
                            .value=${toStr(currentRadius?.bottom_right)}
                            helper="Number, px, rem, or CSS var"
                            @change=${(e) => handleCorner('bottom_right', e)}>
                        </ha-textfield>
                    </lcards-grid-layout>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * Borders Tab - Border sizing and state-based colors
     * @returns {TemplateResult}
     * @private
     */
    _renderBordersTab() {
        return html`
            <lcards-message
                type="info"
                message="Configure SVG border caps (left, top, right, bottom) with sizes and state-based colors.">
            </lcards-message>

            <!-- Corner Radius -->
            ${this._renderBorderRadiusSection()}

            <!-- Left Border -->
            <lcards-form-section
                header="Left Border"
                description="Left border cap configuration"
                icon="mdi:border-left"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.left.enabled', {
                        label: 'Enabled',
                        helper: 'Show left border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.left.size', {
                        label: 'Size (px)',
                        helper: 'Border width in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.border.left.color"
                    header="Left Border Colours"
                    description="State-based colours for left border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Top Border -->
            <lcards-form-section
                header="Top Border"
                description="Top border cap configuration"
                icon="mdi:border-top"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.top.enabled', {
                        label: 'Enabled',
                        helper: 'Show top border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.top.size', {
                        label: 'Size (px)',
                        helper: 'Border height in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.border.top.color"
                    header="Top Border Colours"
                    description="State-based colours for top border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Right Border -->
            <lcards-form-section
                header="Right Border"
                description="Right border cap configuration"
                icon="mdi:border-right"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.right.enabled', {
                        label: 'Enabled',
                        helper: 'Show right border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.right.size', {
                        label: 'Size (px)',
                        helper: 'Border width in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.border.right.color"
                    header="Right Border Colours"
                    description="State-based colours for right border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            <!-- Bottom Border -->
            <lcards-form-section
                header="Bottom Border"
                description="Bottom border cap configuration"
                icon="mdi:border-bottom"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.border.bottom.enabled', {
                        label: 'Enabled',
                        helper: 'Show bottom border cap'
                    })}

                    ${FormField.renderField(this, 'style.border.bottom.size', {
                        label: 'Size (px)',
                        helper: 'Border height in pixels'
                    })}
                </lcards-grid-layout>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="style.border.bottom.color"
                    header="Bottom Border Colours"
                    description="State-based colours for bottom border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>
        `;
    }

    /**
     * Actions Tab - Standard multi-action editor
     * @returns {TemplateResult}
     * @private
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

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Handle actions change from multi-action editor
     * @param {CustomEvent} e - Actions change event
     * @private
     */
    _handleActionsChange(e) {
        const actions = e.detail.value;
        const updatedConfig = {
            ...this.config,
            tap_action: actions.tap_action,
            hold_action: actions.hold_action,
            double_tap_action: actions.double_tap_action
        };
        this._updateConfig(updatedConfig);
    }

    /**
     * Render Component Options tab with dynamic fields from configurableOptions
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentOptionsTab() {
        const componentName = this.config?.component;
        const metadata = this._getComponentMetadata(componentName);

        if (!metadata?.configurableOptions || metadata.configurableOptions.length === 0) {
            return html`
                <lcards-message
                    type="info"
                    message="No component-specific options available.">
                </lcards-message>
            `;
        }

        return html`
            <lcards-form-section
                header="${metadata.displayName || componentName} Options"
                description="Component-specific configuration options"
                icon="mdi:tune-variant"
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message style="margin-bottom: 16px;"
                    type="info"
                    message="These options are specific to the <strong>${metadata.displayName || componentName}</strong> component. Changes will only affect cards using this component."></lcards-message>
                </lcards-message>

                ${metadata.configurableOptions.map(option => this._renderComponentOption(option))}
            </lcards-form-section>
        `;
    }

    /**
     * Render a single component option using schema-based FormField
     * @param {Object} option - Component option metadata with schema format
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentOption(option) {
        const { key, type, description, default: defaultValue } = option;

        // Special handling for color type - use lcards-color-picker
        if (type === 'color' || option['x-ui-hints']?.format === 'color-lcards') {
            // Get current value from config (support nested paths)
            const pathParts = key.split('.');
            let currentValue = this.config;
            for (const part of pathParts) {
                currentValue = currentValue?.[part];
            }
            if (currentValue === undefined) currentValue = defaultValue;

            const label = option['x-ui-hints']?.label || this._formatOptionLabel(key);
            const helper = option['x-ui-hints']?.helper ||
                          (defaultValue !== undefined ? `${description} (default: ${defaultValue})` : description);

            return html`
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--secondary-text-color); margin-bottom: 4px; padding: 0 8px;">
                        ${label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${String(currentValue || '')}
                        .showPreview=${true}
                        ?allowMatchLight=${this._isLightEntity}
                        .entityId=${this.config?.entity || ''}
                        @value-changed=${(e) => this._handleComponentOptionChanged(key, e.detail.value)}>
                    </lcards-color-picker>
                    ${helper ? html`
                        <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">
                            ${helper}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // For all other types, use FormField with option as schema
        // This leverages the existing schema infrastructure
        return html`
            <div style="margin-bottom: 8px;">
                ${this._renderComponentOptionField(key, option)}
            </div>
        `;
    }

    /**
     * Render component option field using FormField
     * Creates temporary schema entry to leverage FormField infrastructure
     * @param {string} key - Option key path
     * @param {Object} option - Option schema definition
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentOptionField(key, option) {
        // Temporarily inject option schema so _getSchemaForPath can find it
        const originalMethod = this._getSchemaForPath;
        this._getSchemaForPath = (path) => {
            if (path === key) {
                return option;
            }
            return originalMethod?.call(this, path);
        };

        // Render using FormField
        const result = FormField.renderField(this, key);

        // Restore original method
        this._getSchemaForPath = originalMethod;

        return result;
    }

    /**
     * Handle component option value changes
     * @param {string} key - Option key (may be nested path like 'style.border.radius')
     * @param {any} value - New value
     * @private
     */
    _handleComponentOptionChanged(key, value) {
        const pathParts = key.split('.');
        const newConfig = { ...this.config };

        // Navigate to the parent object
        let target = newConfig;
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!target[part]) target[part] = {};
            target = target[part];
        }

        // Set the final value
        target[pathParts[pathParts.length - 1]] = value;

        this._updateConfig(newConfig);
    }

    /**
     * Format option key into human-readable label
     * @param {string} key - Option key (e.g., 'show_animation' or 'style.border.radius')
     * @returns {string} Formatted label
     * @private
     */
    _formatOptionLabel(key) {
        // Get the last part of dotted path
        const parts = key.split('.');
        const lastPart = parts[parts.length - 1];

        // Convert snake_case to Title Case
        return lastPart
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Render component information panel with features as chips
     * @param {string} componentName - Component name
     * @returns {TemplateResult}
     * @private
     */
    _renderComponentInfo(componentName) {
        const metadata = this._getComponentMetadata(componentName);

        if (!metadata) {
            return html``;
        }

        const features = metadata.features || [];
        const configurableOptions = metadata.configurableOptions || [];
        const orientation = metadata.orientation || 'auto';

        return html`
            <div style="margin-top: 12px; padding: 12px; background: var(--primary-background-color); border-radius: var(--ha-card-border-radius, 12px);">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary-text-color); font-size: 15px;">
                    ${metadata.displayName || componentName}
                </div>
                ${metadata.description ? html`
                    <div style="margin-bottom: 12px; font-size: 14px; color: var(--secondary-text-color);">
                        ${metadata.description}
                    </div>
                ` : ''}

                <!-- Orientation Info -->
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 13px; color: var(--secondary-text-color); margin-bottom: 6px;">
                        Orientation:
                    </div>
                    <ha-chip-set>
                        <ha-assist-chip
                            .label=${orientation === 'auto' ? 'Flexible' : orientation}
                            .filled=${true}
                            style="
                                --ha-assist-chip-filled-container-color: var(--primary-color);
                                --md-sys-color-primary: white;
                                --md-sys-color-on-surface: white;
                            ">
                            <ha-icon icon="mdi:phone-rotate-landscape" slot="icon"></ha-icon>
                        </ha-assist-chip>
                    </ha-chip-set>
                </div>

                <!-- Features as chips -->
                ${features.length > 0 ? html`
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 13px; color: var(--secondary-text-color); margin-bottom: 6px;">
                            Features:
                        </div>
                        <ha-chip-set>
                            ${features.map(feature => html`
                                <ha-assist-chip
                                    .label=${feature}
                                    .filled=${true}
                                    style="
                                        --ha-assist-chip-filled-container-color: var(--success-color, #4caf50);
                                        --md-sys-color-primary: white;
                                        --md-sys-color-on-surface: white;
                                    ">
                                    <ha-icon icon="mdi:check" slot="icon"></ha-icon>
                                </ha-assist-chip>
                            `)}
                        </ha-chip-set>
                    </div>
                ` : ''}

                <!-- Configurable Options Info -->
                ${configurableOptions.length > 0 ? html`
                    <div style="font-size: 13px; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:tune" style="--mdc-icon-size: 16px; vertical-align: middle; margin-right: 4px;"></ha-icon>
                        <strong>${configurableOptions.length}</strong> configurable option${configurableOptions.length !== 1 ? 's' : ''} available
                        <span style="color: var(--primary-color); font-weight: 500;"> → See "Component Options" tab</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Register custom element
customElements.define('lcards-slider-editor', LCARdSSliderEditor);

lcardsLog.debug('[LCARdSSliderEditor] Standalone editor module loaded');
