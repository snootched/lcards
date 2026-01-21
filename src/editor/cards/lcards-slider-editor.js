/**
 * LCARdS Slider Editor
 *
 * Visual configuration editor for slider cards.
 * 5-tab structure with utility tabs from base class.
 *
 * @extends {LCARdSBaseEditor}
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

    // Track type: Visual rendering style (pills or gauge)
    // Checks: explicit config → preset name → default
    get trackType() {
        // 1. Explicit config wins
        if (this.config.style?.track?.type) {
            return this.config.style.track.type;
        }

        // 2. Infer from preset name (gauge-* = gauge, otherwise pills)
        if (this.preset) {
            return this.preset.startsWith('gauge') ? 'gauge' : 'pills';
        }

        // 3. Default to pills
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
     * Get entity attribute options for dropdown
     * @returns {Array} Array of {value, label} options
     * @private
     */
    _getAttributeOptions() {
        const entityId = this.config?.entity;
        if (!this.hass?.states?.[entityId]) {
            return [{ value: '', label: '(State)' }];
        }

        const state = this.hass.states[entityId];
        const attributes = Object.keys(state.attributes || {});

        return [
            { value: '', label: '(State)' },
            ...attributes.map(attr => ({ value: attr, label: attr }))
        ];
    }

    /**
     * Render attribute selector dropdown
     * @returns {TemplateResult}
     * @private
     */
    _renderAttributeSelector() {
        const options = this._getAttributeOptions();
        const currentValue = this.config?.control?.attribute || '';

        // Check if current value is valid (exists in entity attributes)
        const entityId = this.config?.entity;
        const entity = this.hass?.states?.[entityId];
        const isValidAttribute = !currentValue ||
                                currentValue === '' ||
                                (entity?.attributes && currentValue in entity.attributes);

        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${'Attribute'}
                .helper=${'Entity attribute to control (e.g., brightness). Leave as (State) to control main entity value.'}
                .selector=${{
                    select: {
                        mode: 'dropdown',
                        options: options,
                        custom_value: true
                    }
                }}
                .value=${currentValue}
                @value-changed=${(e) => this._handleAttributeChange(e)}>
            </ha-selector>

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
        const updates = {
            control: {
                ...this.config?.control,
                attribute: value || undefined
            }
        };
        this._updateConfig(updates);
    }

    /**
     * Define editor tabs - 5 tabs + utility tabs from base class
     * @returns {Array} Tab definitions
     * @protected
     */
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
            { label: 'Slider Track', content: () => this._renderTrackTab() },
            { label: 'Borders', content: () => this._renderBordersTab() },
            { label: 'Text Fields', content: () => this._renderTextTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
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
                type: 'custom',
                render: () => html`
                    <lcards-message
                        type="info"
                        message="Configure your slider: Choose a component shell (basic or styled), apply a preset for quick styling, and select the entity to control.">
                    </lcards-message>
                `
            },
            {
                type: 'section',
                header: 'Component & Preset',
                description: 'Shell SVG and visual style presets',
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
                                type: 'field',
                                path: 'style.track.orientation',
                                label: 'Orientation',
                                helper: 'Layout direction (horizontal or vertical)'
                            }
                        ]
                    },
                    {
                        type: 'field',
                        path: 'preset',
                        label: 'Style Preset',
                        helper: 'Quick styling (pills-basic, gauge-basic, etc.)'
                    },
                    ...(state.preset ? [{
                        type: 'custom',
                        render: () => html`
                            <lcards-message
                                type="success"
                                message="✓ Preset '${state.preset}' applied! Track style, colors, and spacing configured automatically.">
                            </lcards-message>
                        `
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
                ?expanded=${true}
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

            <!-- Dynamic: Pills or Gauge Configuration with INLINE COLORS -->
            ${trackType === 'pills' ? this._renderPillsConfiguration() : this._renderGaugeConfiguration()}

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
     * Ranges Configuration - Color-coded value zones
     * @returns {TemplateResult}
     * @private
     */
    _renderRangesConfiguration() {
        const ranges = this.config?.style?.ranges || [];

        return html`
            <lcards-form-section
                header="Color-Coded Ranges"
                description="Define visual zones for context (cold/comfort/hot, low/normal/high)"
                icon="mdi:palette"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <lcards-message
                    type="info"
                    message="Ranges provide visual context: background segments in gauge mode, color overrides in pills mode">
                </lcards-message>

                <div class="range-list" style="display: flex; flex-direction: column; gap: 8px; margin: 16px 0;">
                    ${ranges.length === 0 ? html`
                        <div style="text-align: center; padding: 32px 16px; color: var(--secondary-text-color);">
                            <ha-icon icon="mdi:palette-outline" style="font-size: 48px; opacity: 0.3; display: block; margin: 0 auto 12px;"></ha-icon>
                            <div style="font-weight: 600; margin-bottom: 4px;">No ranges defined</div>
                            <div>Add a range to create color-coded zones</div>
                        </div>
                    ` : html`
                        ${ranges.map((range, index) => this._renderRangeItem(range, index))}
                    `}
                </div>

                <!-- Add Button -->
                <ha-button class="add-button" @click=${() => this._addRange()}>
                    <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                    Add Range
                </ha-button>
            </lcards-form-section>
        `;
    }

    /**
     * Render a single range item in the array editor
     * @param {Object} range - Range configuration
     * @param {number} index - Range index
     * @returns {TemplateResult}
     * @private
     */
    _renderRangeItem(range, index) {
        const basePath = `style.ranges.${index}`;
        const isExpanded = this._expandedRanges[index] || false;
        const rangeDisplay = range.label || `${range.min || 0} - ${range.max || 100}`;

        const itemStyle = 'background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;';
        const headerStyle = 'display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; user-select: none; background: var(--secondary-background-color);';
        const iconStyle = 'color: var(--primary-color); --mdc-icon-size: 24px;';
        const infoStyle = 'flex: 1; min-width: 0;';
        const labelStyle = 'font-weight: 600; font-size: 14px;';
        const valueStyle = 'font-size: 12px; color: var(--secondary-text-color); margin-top: 2px;';
        const actionsStyle = 'display: flex; gap: 4px;';
        const expandIconStyle = `transition: transform 0.2s;${isExpanded ? ' transform: rotate(180deg);' : ''}`;
        const contentStyle = 'padding: 16px; border-top: 1px solid var(--divider-color);';

        return html`
            <div class="range-item" style="${itemStyle}">
                <!-- Range Header -->
                <div class="range-header" style="${headerStyle}" @click=${() => this._toggleRangeExpanded(index)}>
                    <ha-icon style="${iconStyle}" icon="mdi:chart-box"></ha-icon>

                    <div style="${infoStyle}">
                        <div style="${labelStyle}">Range ${index + 1}</div>
                        <div style="${valueStyle}">${rangeDisplay}</div>
                    </div>

                    <div style="${actionsStyle}">
                        <ha-icon-button
                            @click=${(e) => this._deleteRange(e, index)}
                            .label=${'Delete'}
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        style="${expandIconStyle}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Range Content (Expanded) -->
                ${isExpanded ? html`
                    <div style="${contentStyle}"
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
                            basePath="${basePath}.color"
                            header="Range Color"
                            description="Background color for this range"
                            ?singleColor=${true}
                            ?expanded=${true}
                            ?useColorPicker=${true}>
                        </lcards-color-section>

                        <lcards-grid-layout columns="2">
                            ${FormField.renderField(this, `${basePath}.label`, {
                                label: 'Label',
                                helper: 'Optional descriptive label (Cold, Normal, Hot)'
                            })}

                            ${FormField.renderField(this, `${basePath}.opacity`, {
                                label: 'Opacity',
                                helper: 'Background opacity (0-1, default: 0.3)'
                            })}
                        </lcards-grid-layout>
                    </div>
                ` : ''}
            </div>
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
     * Add a new range to the configuration
     * @private
     */
    _addRange() {
        const ranges = this.config?.style?.ranges || [];
        const newRange = {
            min: 0,
            max: 100,
            color: 'var(--primary-color)',
            label: '',
            opacity: 0.3
        };

        this._updateConfig({
            style: {
                ...this.config.style,
                ranges: [...ranges, newRange]
            }
        });
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
                ?expanded=${true}
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
                    header="Gradient Colors"
                    description="Start and end colors for pill gradient"
                    .colorPaths=${[
                        { path: 'style.track.segments.gradient.start', label: 'Gradient Start', helper: 'Color at minimum value (left/bottom)' },
                        { path: 'style.track.segments.gradient.end', label: 'Gradient End', helper: 'Color at maximum value (right/top)' }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>

                ${FormField.renderField(this, 'style.track.segments.gradient.interpolated', {
                    label: 'Interpolate Colors',
                    helper: 'Blend colors smoothly across segments'
                })}
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
                ?expanded=${true}
                ?outlined=${true}
                headerLevel="4">

                <lcards-grid-layout>
                    ${FormField.renderField(this, 'style.gauge.progress_bar.height', {
                        label: 'Height',
                        helper: 'Progress bar height in pixels (default: 12)'
                    })}

                    ${FormField.renderField(this, 'style.gauge.progress_bar.radius', {
                        label: 'Border Radius',
                        helper: 'Progress bar border radius in pixels (default: 2)'
                    })}
                </lcards-grid-layout>

                <!-- INLINE: Progress bar color -->
                <lcards-color-section
                    .editor=${this}
                    basePath="style.gauge.progress_bar.color"
                    header="Progress Bar Color"
                    description="Color of the filled progress bar"
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
                ?expanded=${true}
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

                <!-- INLINE: Tick mark color -->
                <lcards-color-section
                    .editor=${this}
                    basePath="style.gauge.scale.tick_marks.major.color"
                    header="Tick Mark Color"
                    description="Color for scale tick marks (both major and minor)"
                    ?singleColor=${true}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>

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

                        ${FormField.renderField(this, 'style.gauge.scale.labels.unit', {
                        label: 'Unit',
                        helper: 'Unit to append to values (%, °C, °F, W, etc.)'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.font_size', {
                        label: 'Font Size',
                        helper: 'Label font size in pixels'
                    })}

                        ${FormField.renderField(this, 'style.gauge.scale.labels.padding', {
                        label: 'Padding',
                        helper: 'Space between tick and label in pixels'
                    })}
                    </lcards-grid-layout>

                    <!-- INLINE: Label color -->
                    <lcards-color-section
                        .editor=${this}
                        basePath="style.gauge.scale.labels.color"
                        header="Label Color"
                        description="Color for scale numeric labels"
                        ?singleColor=${true}
                        ?expanded=${false}
                        ?useColorPicker=${true}>
                    </lcards-color-section>
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

                <lcards-grid-layout>
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
                </lcards-grid-layout>

                <!-- INLINE: Indicator colors -->
                <lcards-color-section
                    .editor=${this}
                    header="Indicator Colors"
                    description="Colors for value indicator marker"
                    .colorPaths=${[
                        {
                            path: 'style.gauge.indicator.color',
                            label: 'Indicator Color',
                            helper: 'Color of value indicator'
                        },
                        {
                            path: 'style.gauge.indicator.border.color',
                            label: 'Border Color',
                            helper: 'Color of indicator border'
                        }
                    ]}
                    ?expanded=${false}
                    ?useColorPicker=${true}>
                </lcards-color-section>
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

            <!-- Left Border -->
            <lcards-form-section
                header="Left Border"
                description="Left border cap configuration"
                icon="mdi:border-left"
                ?expanded=${true}
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
                    basePath="style.border.left.color"
                    header="Left Border Colors"
                    description="State-based colors for left border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
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
                    basePath="style.border.top.color"
                    header="Top Border Colors"
                    description="State-based colors for top border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
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
                    basePath="style.border.right.color"
                    header="Right Border Colors"
                    description="State-based colors for right border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
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
                    basePath="style.border.bottom.color"
                    header="Bottom Border Colors"
                    description="State-based colors for bottom border - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable']}
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
}

// Register custom element
customElements.define('lcards-slider-editor', LCARdSSliderEditor);

lcardsLog.info('[LCARdSSliderEditor] Standalone editor module loaded');
